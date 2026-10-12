import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { EmptyState, PageHeader, PanelHeading } from "@/components/WorkspacePage";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link2, Wallet, Globe, CheckCircle2, Clock, ExternalLink, FileCheck, ShieldCheck, Loader2, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ethers, BrowserProvider } from "ethers";

interface WalletInfo {
  address: string;
  balance: string;
  network: string;
  chainId: number;
}

interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  blockNumber: number;
  timestamp: string;
  status: "Confirmed" | "Pending";
}

export default function BlockchainNotarization() {
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [connecting, setConnecting] = useState(false);
  const [loadingTxns, setLoadingTxns] = useState(false);
  const [error, setError] = useState("");

  const connectWallet = useCallback(async () => {
    setConnecting(true);
    setError("");
    // Wait for MetaMask injection
    if (!window.ethereum) {
      await new Promise<void>((resolve) => {
        const interval = setInterval(() => {
          if (window.ethereum) { clearInterval(interval); resolve(); }
        }, 100);
        setTimeout(() => { clearInterval(interval); resolve(); }, 3000);
      });
    }

    if (!window.ethereum) {
      setError("MetaMask not detected. Please install the MetaMask browser extension.");
      setConnecting(false);
      return;
    }

    setConnecting(true);
    setError("");

    try {
      const provider = new BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const balance = await provider.getBalance(address);
      const network = await provider.getNetwork();

      const networkNames: Record<number, string> = {
        1: "Ethereum Mainnet",
        5: "Goerli Testnet",
        11155111: "Sepolia Testnet",
        137: "Polygon Mainnet",
        80001: "Polygon Mumbai",
        56: "BSC Mainnet",
        42161: "Arbitrum One",
        10: "Optimism",
      };

      setWallet({
        address,
        balance: ethers.formatEther(balance),
        network: networkNames[Number(network.chainId)] || `Chain ${network.chainId}`,
        chainId: Number(network.chainId),
      });

      // Fetch recent transactions from Etherscan-compatible API
      setLoadingTxns(true);
      await fetchTransactions(address, Number(network.chainId));
    } catch (err) {
      console.error("Wallet connection error:", err);
      setError(err instanceof Error ? err.message : "Failed to connect wallet.");
    } finally {
      setConnecting(false);
    }
  }, []);

  const fetchTransactions = async (address: string, chainId: number) => {
    try {
      // Etherscan API keys and base URLs by network
      const apiConfig: Record<number, { url: string; key: string }> = {
        1: { url: "https://api.etherscan.io/api", key: "YourApiKeyToken" },
        11155111: { url: "https://api-sepolia.etherscan.io/api", key: "YourApiKeyToken" },
        5: { url: "https://api-goerli.etherscan.io/api", key: "YourApiKeyToken" },
        137: { url: "https://api.polygonscan.com/api", key: "YourApiKeyToken" },
      };

      const config = apiConfig[chainId];
      if (!config) {
        // For unsupported networks, show empty state
        setTransactions([]);
        setLoadingTxns(false);
        return;
      }

      const response = await fetch(
        `${config.url}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=10&sort=desc&apikey=${config.key}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.status === "1" && Array.isArray(data.result)) {
          const txns: Transaction[] = data.result.map((tx: Record<string, string>) => ({
            hash: tx.hash,
            from: tx.from,
            to: tx.to || "Contract Creation",
            value: ethers.formatEther(tx.value || "0"),
            blockNumber: parseInt(tx.blockNumber),
            timestamp: new Date(parseInt(tx.timeStamp) * 1000).toISOString(),
            status: tx.txreceipt_status === "1" ? "Confirmed" : "Pending",
          }));
          setTransactions(txns);
        } else {
          setTransactions([]);
        }
      }
    } catch (err) {
      console.error("Failed to fetch transactions:", err);
      setTransactions([]);
    } finally {
      setLoadingTxns(false);
    }
  };

  // Listen for account/chain changes
  useEffect(() => {
    const ethereum = window.ethereum;
    if (!ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        setWallet(null);
        setTransactions([]);
      } else {
        connectWallet();
      }
    };

    const handleChainChanged = () => {
      connectWallet();
    };

    ethereum.on?.("accountsChanged", handleAccountsChanged);
    ethereum.on?.("chainChanged", handleChainChanged);

    return () => {
      ethereum.removeListener?.("accountsChanged", handleAccountsChanged);
      ethereum.removeListener?.("chainChanged", handleChainChanged);
    };
  }, [connectWallet]);

  const getEtherscanUrl = (hash: string) => {
    if (!wallet) return "#";
    const urls: Record<number, string> = {
      1: "https://etherscan.io",
      11155111: "https://sepolia.etherscan.io",
      5: "https://goerli.etherscan.io",
      137: "https://polygonscan.com",
    };
    const base = urls[wallet.chainId] || "https://etherscan.io";
    return `${base}/tx/${hash}`;
  };

  const shortenAddress = (addr: string) =>
    addr.length > 10 ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : addr;

  const shortenHash = (hash: string) =>
    hash.length > 16 ? `${hash.slice(0, 10)}...${hash.slice(-6)}` : hash;

  return (
    <DashboardLayout>
      <div className="ws-page">
        <PageHeader section="Protection" title="Notarization" description="Your wallet connection and on-chain records." />

        {!wallet ? (
          /* Not connected — Prompt to connect MetaMask */
          <div className="ws-two-column">
            <section className="card-enterprise"><PanelHeading title="Wallet connection" description="Ethereum-compatible wallets" action={<span className="badge-encrypted">Not connected</span>} />
              <EmptyState icon={Wallet} title="Connect your wallet" description="Connect MetaMask to view your wallet address, balance and network." action={<Button size="sm" onClick={connectWallet} disabled={connecting}>{connecting ? <Loader2 className="animate-spin" /> : <Wallet />}{connecting ? "Connecting..." : "Connect MetaMask"}</Button>} />
              {error && <div className="ws-error m-5" role="alert">{error}</div>}
            </section>
            <aside className="card-enterprise"><PanelHeading title="Connection details" /><div className="ws-detail-list">
              <div className="ws-detail-row"><Globe size={18} /><div><strong>Network</strong><small>Selected in your wallet</small></div><span>Not connected</span></div>
              <div className="ws-detail-row"><Link2 size={18} /><div><strong>Transaction history</strong><small>Requires a configured explorer service</small></div></div>
              <div className="ws-detail-row"><FileCheck size={18} /><div><strong>Proof of existence</strong><small>Notarization service not connected yet</small></div></div>
            </div></aside>
          </div>
        ) : (
          /* Connected — Show real wallet data */
          <>
            {/* Wallet + Stats */}
            <div className="ws-metrics">
              <div className="card-enterprise p-5 md:col-span-1">
                <div className="flex items-center gap-2 mb-3">
                  <Wallet className="h-5 w-5 text-primary" />
                  <h3 className="section-title text-sm">Connected Wallet</h3>
                </div>
                <p className="font-mono text-xs text-foreground mb-1">{shortenAddress(wallet.address)}</p>
                <p className="text-xs text-muted-foreground mb-2">{parseFloat(wallet.balance).toFixed(4)} ETH</p>
                <div className="flex items-center gap-2">
                  <div className="badge-success"><Globe className="h-3 w-3" />{wallet.network}</div>
                </div>
              </div>

              {[
                { label: "Total Transactions", value: transactions.length.toString(), icon: Link2 },
                { label: "Confirmed", value: transactions.filter((t) => t.status === "Confirmed").length.toString(), icon: CheckCircle2 },
                { label: "Pending", value: transactions.filter((t) => t.status === "Pending").length.toString(), icon: Clock },
              ].map((s) => (
                <div key={s.label} className="card-enterprise p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <s.icon className="h-4 w-4 text-primary" />
                    <span className="stat-label">{s.label}</span>
                  </div>
                  <span className="stat-value">{s.value}</span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="ws-toolbar">
              <Button className="gap-2" disabled title="Notarization service not connected"><FileCheck className="h-4 w-4" />Generate proof</Button>
              <Button variant="outline" className="gap-2" disabled title="Verification service not connected"><ShieldCheck className="h-4 w-4" />Verify record</Button>
              <Button
                variant="outline"
                className="gap-2 ml-auto text-muted-foreground"
                onClick={() => { setWallet(null); setTransactions([]); }}
              >
                Disconnect
              </Button>
            </div>

            {/* Transaction Table */}
            <div className="card-enterprise overflow-hidden">
              <PanelHeading title="Transaction history" description="Recent transactions from the connected explorer" />
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs font-semibold text-muted-foreground">Tx Hash</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">From</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">To</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">Value (ETH)</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">Timestamp</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">Status</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">Verify</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingTxns ? (
                    Array(5).fill(0).map((_, i) => (
                      <TableRow key={i}>
                        {Array(7).fill(0).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}
                      </TableRow>
                    ))
                  ) : transactions.length > 0 ? (
                    transactions.map((tx) => (
                      <TableRow key={tx.hash}>
                        <TableCell className="font-mono text-xs text-foreground">{shortenHash(tx.hash)}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{shortenAddress(tx.from)}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{shortenAddress(tx.to)}</TableCell>
                        <TableCell className="text-sm text-foreground">{parseFloat(tx.value).toFixed(6)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(tx.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </TableCell>
                        <TableCell>
                          <span className={tx.status === "Confirmed" ? "badge-success" : "badge-warning"}>
                            {tx.status === "Confirmed" ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                            {tx.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <a href={getEtherscanUrl(tx.hash)} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="sm" className="gap-1 text-xs text-primary"><ExternalLink className="h-3 w-3" />View</Button>
                          </a>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground italic">
                        No transactions found for this wallet on {wallet.network}.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
