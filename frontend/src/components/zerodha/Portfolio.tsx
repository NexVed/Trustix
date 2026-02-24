import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowUpRight, ArrowDownRight, Briefcase } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import axios from 'axios';

interface Holding {
    symbol: string;
    quantity: number;
    avg_price: number;
    current_price: number;
    pnl: number;
}

interface PortfolioData {
    total_investment: number;
    current_value: number;
    profit_loss: number;
    holdings: Holding[];
}

export const Portfolio = () => {
    const [data, setData] = useState<PortfolioData | null>(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const fetchPortfolio = async () => {
            try {
                const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
                const token = localStorage.getItem('trustix.auth.token');

                const response = await axios.get(`${apiUrl}/zerodha/portfolio`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                setData(response.data);
            } catch (error: any) {
                if (error.response?.status === 404) {
                    // User hasn't connected Zerodha yet, this is expected.
                } else {
                    console.error("Failed to fetch portfolio:", error);
                    toast({
                        title: "Portfolio Sync Failed",
                        description: "Could not retrieve your Zerodha holdings. Your session may have expired.",
                        variant: "destructive"
                    });
                }
            } finally {
                setLoading(false);
            }
        };

        fetchPortfolio();
    }, []);

    if (loading) {
        return (
            <Card className="w-full bg-black/40 border-white/10 animate-pulse h-64 flex items-center justify-center">
                <p className="text-gray-400">Syncing with Zerodha...</p>
            </Card>
        );
    }

    if (!data) {
        return null; // Don't render portfolio list if not connected
    }

    const isProfit = data.profit_loss >= 0;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-black/60 border-white/10 backdrop-blur-md">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-400">Total Investment</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">₹{data.total_investment.toLocaleString()}</div>
                    </CardContent>
                </Card>

                <Card className="bg-black/60 border-white/10 backdrop-blur-md">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-400">Current Value</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">₹{data.current_value.toLocaleString()}</div>
                    </CardContent>
                </Card>

                <Card className="bg-black/60 border-white/10 backdrop-blur-md">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-400">Total P&L</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold flex items-center gap-2 ${isProfit ? 'text-green-500' : 'text-red-500'}`}>
                            {isProfit ? <ArrowUpRight size={24} /> : <ArrowDownRight size={24} />}
                            ₹{Math.abs(data.profit_loss).toLocaleString()}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-black/60 border-white/10 backdrop-blur-md">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                        <Briefcase className="text-blue-400" />
                        Equity Holdings
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border border-white/10 overflow-hidden">
                        <Table>
                            <TableHeader className="bg-white/5">
                                <TableRow className="border-white/10 hover:bg-white/5">
                                    <TableHead className="text-gray-300">Symbol</TableHead>
                                    <TableHead className="text-right text-gray-300">Qty</TableHead>
                                    <TableHead className="text-right text-gray-300">Avg. Price</TableHead>
                                    <TableHead className="text-right text-gray-300">LTP</TableHead>
                                    <TableHead className="text-right text-gray-300">P&L</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.holdings.length === 0 ? (
                                    <TableRow className="border-white/10 hover:bg-white/5">
                                        <TableCell colSpan={5} className="text-center text-gray-500 py-6">
                                            No holdings found in your Demat account.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    data.holdings.map((stock) => (
                                        <TableRow key={stock.symbol} className="border-white/10 hover:bg-white/5">
                                            <TableCell className="font-medium text-white">{stock.symbol}</TableCell>
                                            <TableCell className="text-right text-gray-300">{stock.quantity}</TableCell>
                                            <TableCell className="text-right text-gray-300 border-x-transparent">₹{stock.avg_price.toLocaleString()}</TableCell>
                                            <TableCell className="text-right text-gray-300">₹{stock.current_price.toLocaleString()}</TableCell>
                                            <TableCell className={`text-right font-medium ${stock.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                {stock.pnl >= 0 ? '+' : ''}₹{stock.pnl.toLocaleString()}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
