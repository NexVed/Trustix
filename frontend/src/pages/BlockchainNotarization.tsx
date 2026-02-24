import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link2, Wallet, Globe, CheckCircle2, Clock, ExternalLink, FileCheck, ShieldCheck, Loader2, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ethers, BrowserProvider } from "ethers";

// Extend Window for MetaMask
declare global {
  interface Window {
    ethereum?: any;
  }
}

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
    } catch (err: any) {
      console.error("Wallet connection error:", err);
      setError(err.message || "Failed to connect wallet.");
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
          const txns: Transaction[] = data.result.map((tx: any) => ({
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
    if (!window.ethereum) return;

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

    window.ethereum.on?.("accountsChanged", handleAccountsChanged);
    window.ethereum.on?.("chainChanged", handleChainChanged);

    return () => {
      window.ethereum.removeListener?.("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener?.("chainChanged", handleChainChanged);
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
      <div className="space-y-6">
        <div>
          <h1 className="page-title">Blockchain Notarization</h1>
          <p className="page-subtitle">Immutable proof-of-existence records linked to your wallet</p>
        </div>

        {!wallet ? (
          /* Not connected — Prompt to connect MetaMask */
          <div className="card-enterprise p-12 text-center max-w-xl mx-auto">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-5">
              <Wallet className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Connect Your Wallet</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
              Connect your MetaMask wallet to view your on-chain transaction history and create immutable notarization records.
            </p>

            {error && (
              <div className="flex items-center gap-2 justify-center text-destructive text-sm mb-4 bg-destructive/10 p-3 rounded-lg">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <Button
              onClick={connectWallet}
              disabled={connecting}
              className="gap-2 h-12 px-8 text-base"
            >
              {connecting ? (
                <><Loader2 className="h-4 w-4 animate-spin" />Connecting...</>
              ) : (
                <><Wallet className="h-4 w-4" />Connect MetaMask</>
              )}
            </Button>
          </div>
        ) : (
          /* Connected — Show real wallet data */
          <>
            {/* Wallet + Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <div className="flex gap-2">
              <Button className="gap-2"><FileCheck className="h-4 w-4" />Generate Proof of Existence</Button>
              <Button variant="outline" className="gap-2"><ShieldCheck className="h-4 w-4" />Verify Blockchain Record</Button>
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
