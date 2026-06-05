import React, { useState, useEffect } from 'react';
// --- CATATAN UNTUK PENGGUNAAN DI VS CODE LOKAL ---
// Silakan hapus tanda komentar (//) pada dua baris di bawah ini 
// agar aplikasi dapat berjalan dengan baik di lingkungan lokal Anda.
// import { ethers } from 'ethers';
// import wavePortalJSON from './WavePortal.json';

import { Wallet, Send, History, Sparkles, Loader2, MessageSquare, Fingerprint, ExternalLink } from 'lucide-react';

// GANTI DENGAN ALAMAT KONTRAK ANDA DARI TERMINAL SEBELUMNYA!
const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; 

// Untuk pratinjau di sini, gunakan array kosong. Di VS Code, aktifkan baris di bawahnya
const contractABI = []; 
// const contractABI = wavePortalJSON.abi;

// Mock object ethers agar pratinjau di platform ini tidak error
const ethers = {
  BrowserProvider: class { getSigner() { return {}; } },
  Contract: class {
    constructor() {
      this.getAllWaves = async () => [];
      this.wave = async () => ({ hash: '0x123', wait: async () => {} });
    }
  }
};

export default function App() {
  const [currentAccount, setCurrentAccount] = useState(null);
  const [message, setMessage] = useState('');
  const [isMining, setIsMining] = useState(false);
  const [waves, setWaves] = useState([]);

  // Mengecek apakah MetaMask sudah terhubung
  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        console.log("Pastikan Anda memiliki MetaMask!");
        return;
      }
      const accounts = await ethereum.request({ method: "eth_accounts" });
      if (accounts.length !== 0) {
        const account = accounts[0];
        setCurrentAccount(account);
        getAllWaves(); // Ambil data jika dompet sudah terhubung
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Fungsi untuk menghubungkan MetaMask
  const connectWallet = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        alert("Ambil MetaMask! https://metamask.io/");
        return;
      }
      const accounts = await ethereum.request({ method: "eth_requestAccounts" });
      setCurrentAccount(accounts[0]);
      getAllWaves();
    } catch (error) {
      console.error(error);
    }
  };

  // Mengambil semua jejak (waves) dari Smart Contract
  const getAllWaves = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.BrowserProvider(ethereum);
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, provider);

        const waves = await wavePortalContract.getAllWaves();
        
        // Membersihkan format data dari kontrak agar mudah dibaca React
        const wavesCleaned = waves.map(wave => {
          return {
            address: wave.waver,
            timestamp: new Date(Number(wave.timestamp) * 1000), // Convert detik ke milidetik
            message: wave.message
          };
        });

        // Urutkan dari yang terbaru
        setWaves(wavesCleaned.sort((a, b) => b.timestamp - a.timestamp));
      }
    } catch (error) {
      console.error("Gagal mengambil pesan:", error);
    }
  };

  // Fungsi Mengirim Pesan ke Blockchain
  const wave = async (e) => {
    e.preventDefault();
    if (!message) return;

    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.BrowserProvider(ethereum);
        const signer = await provider.getSigner(); // Meminta izin user (MetaMask) untuk bayar gas
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        setIsMining(true);
        
        // Menulis ke blockchain
        console.log("Meminta konfirmasi transaksi...");
        const waveTxn = await wavePortalContract.wave(message);
        
        console.log("Sedang di-mining...", waveTxn.hash);
        await waveTxn.wait(); // Menunggu transaksi selesai dikonfirmasi jaringan
        console.log("Berhasil di-mining!", waveTxn.hash);

        setMessage('');
        setIsMining(false);
        getAllWaves(); // Refresh daftar pesan setelah berhasil
      }
    } catch (error) {
      console.error("Transaksi dibatalkan atau gagal:", error);
      setIsMining(false);
    }
  };

  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(date);
  };

  const shortenAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-fuchsia-600/20 blur-[120px] pointer-events-none" />

      <nav className="border-b border-slate-800/60 bg-slate-950/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-xl tracking-tight text-white">WavePortal</h1>
              <p className="text-xs text-slate-400 font-medium">Buku Tamu Abadi</p>
            </div>
          </div>

          {!currentAccount ? (
            <button 
              onClick={connectWallet}
              className="group flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-slate-700 hover:border-indigo-500/50 transition-all duration-300 px-5 py-2.5 rounded-full font-medium text-sm text-white"
            >
              <Wallet className="w-4 h-4 text-indigo-400 group-hover:text-indigo-300" />
              Hubungkan MetaMask
            </button>
          ) : (
            <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 px-4 py-2 rounded-full shadow-inner">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-mono text-slate-300">{shortenAddress(currentAccount)}</span>
            </div>
          )}
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12 relative z-10">
        <div className="lg:col-span-5 flex flex-col gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
              <Fingerprint className="w-3.5 h-3.5" />
              Web3 Immutable Record
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-white leading-tight">
              Tinggalkan Jejak <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-fuchsia-400">
                Secara Permanen.
              </span>
            </h2>
            <p className="text-slate-400 leading-relaxed text-lg">
              Hubungkan dompet Web3 Anda dan tuliskan pesan yang akan disimpan selamanya di dalam Smart Contract.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
            {currentAccount ? (
              <form onSubmit={wave} className="flex flex-col gap-4">
                <label htmlFor="message" className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Pesan Anda
                </label>
                <textarea
                  id="message"
                  rows="4"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ketik kesan, pesan, atau apapun di sini..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all resize-none"
                  disabled={isMining}
                />
                
                <button
                  type="submit"
                  disabled={isMining || !message}
                  className="relative group w-full bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:from-indigo-500 hover:to-fuchsia-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3.5 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 overflow-hidden"
                >
                  {isMining ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Mencatat ke Blockchain...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" />
                      Kirim ke Jaringan
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="text-center py-8 px-4 flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-2">
                  <Wallet className="w-8 h-8 text-slate-500" />
                </div>
                <h3 className="text-lg font-semibold text-white">Dompet Belum Terhubung</h3>
                <button 
                  onClick={connectWallet}
                  className="w-full bg-slate-100 hover:bg-white text-slate-900 font-semibold py-3 px-6 rounded-xl transition-colors"
                >
                  Hubungkan Dompet Sekarang
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-7 flex flex-col h-full">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-400" />
              Jejak Publik
            </h3>
            <div className="bg-slate-900 border border-slate-800 rounded-full px-4 py-1.5 text-sm font-medium">
              Total Jejak: <span className="text-indigo-400 font-bold">{waves.length}</span>
            </div>
          </div>

          <div className="flex-1 bg-slate-900/40 border border-slate-800/80 rounded-3xl p-2 md:p-6 shadow-2xl backdrop-blur-md overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-950/80 pointer-events-none z-10 rounded-3xl" />
            
            <div className="h-[600px] overflow-y-auto pr-2 pb-20 space-y-4 relative z-0 custom-scrollbar">
              {waves.length === 0 && (
                <div className="text-center text-slate-500 py-10">Belum ada jejak. Jadilah yang pertama!</div>
              )}
              {waves.map((wave, index) => (
                <div 
                  key={index} 
                  className="group bg-slate-950/80 border border-slate-800 hover:border-slate-600 rounded-2xl p-5 transition-all duration-300 hover:shadow-lg hover:shadow-slate-900/50"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-slate-800 to-slate-700 flex items-center justify-center p-[2px]">
                        <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-xs font-mono text-slate-400 overflow-hidden">
                           <div className="w-full h-full bg-indigo-500/20" style={{ backgroundImage: `radial-gradient(circle at center, #6366f1 10%, transparent 20%), radial-gradient(circle at center, #d946ef 10%, transparent 20%)`, backgroundSize: '10px 10px', backgroundPosition: '0 0, 5px 5px' }} />
                        </div>
                      </div>
                      <div>
                        <span className="font-mono text-sm font-semibold text-indigo-300 flex items-center gap-1">
                          {shortenAddress(wave.address)}
                        </span>
                        <p className="text-xs text-slate-500">{formatDate(wave.timestamp)}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800/50 text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                    {wave.message}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}