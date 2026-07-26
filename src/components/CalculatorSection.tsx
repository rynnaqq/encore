import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calculator, CheckCircle2, QrCode, ScanFace } from 'lucide-react';

export const CalculatorSection: React.FC = () => {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  
  // Payment state
  const [showPayment, setShowPayment] = useState(false);
  const [price, setPrice] = useState(0);
  const [pendingResult, setPendingResult] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const handleNumber = (num: string) => {
    if (display === '0' || display === 'Error') {
      setDisplay(num);
    } else {
      setDisplay(display + num);
    }
  };

  const handleOperator = (op: string) => {
    if (display === 'Error') return;
    setEquation(display + ' ' + op + ' ');
    setDisplay('0');
  };

  const initiateCalculation = () => {
    try {
      // Evaluate the equation string + current display securely
      const fullEq = equation + display;
      // Using new Function instead of eval for safer evaluation
      const result = new Function('return ' + fullEq)();
      
      let finalResult = 'Error';
      if (isFinite(result)) {
        // Format to max 8 decimal places
        finalResult = String(Math.round(result * 100000000) / 100000000);
      }
      
      // Determine complexity (number of operators)
      const operatorsMatch = fullEq.match(/[+\-*/]/g);
      const numOperators = operatorsMatch ? operatorsMatch.length : 0;
      
      let calculatedPrice = 2000; // Base price Rp 2.000
      if (numOperators >= 3) {
        calculatedPrice = 15000; // Hard Rp 15.000
      } else if (numOperators >= 1) {
        calculatedPrice = 5000; // Medium Rp 5.000
      }
      
      setPrice(calculatedPrice);
      setPendingResult(finalResult);
      setShowPayment(true);
      setPaymentSuccess(false);
      
    } catch (e) {
      setDisplay('Error');
      setEquation('');
    }
  };

  const handlePayment = () => {
    setIsProcessing(true);
    // Mock processing delay for QRIS scan
    setTimeout(() => {
      setIsProcessing(false);
      setPaymentSuccess(true);
      
      // Reveal answer after success
      setTimeout(() => {
        if (pendingResult) {
          setDisplay(pendingResult);
          setEquation('');
        }
        setShowPayment(false);
      }, 1500);
    }, 2000);
  };

  const clear = () => {
    setDisplay('0');
    setEquation('');
  };

  const toggleSign = () => {
    if (display !== '0' && display !== 'Error') {
      setDisplay(display.startsWith('-') ? display.slice(1) : '-' + display);
    }
  };

  const handlePercent = () => {
    if (display !== 'Error') {
      setDisplay(String(parseFloat(display) / 100));
    }
  };

  const btnClass = "flex-1 aspect-square rounded-2xl text-xl sm:text-2xl font-bold font-mono transition-all flex items-center justify-center cursor-pointer shadow-sm active:scale-95";
  const numBtnClass = `${btnClass} bg-white text-slate-800 border-2 border-slate-100 hover:border-[#FFCCE1] hover:text-[#E195AB]`;
  const opBtnClass = `${btnClass} bg-[#E195AB] text-white border-2 border-[#E195AB] hover:bg-[#FFCCE1] hover:text-[#E195AB] hover:border-[#FFCCE1]`;
  const actBtnClass = `${btnClass} bg-[#FFF5D7] text-[#E195AB] border-2 border-[#FFCCE1] hover:bg-[#FFCCE1] hover:text-white`;

  return (
    <section id="game" className="min-h-screen py-24 flex items-center justify-center relative overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10 flex flex-col items-center">
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FFCCE1] text-[#E195AB] font-mono text-sm font-bold tracking-wide mb-4">
            <Calculator className="w-4 h-4" />
            <span>PREMIUM CALCULATOR</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold text-slate-800 tracking-tight">Crunch The Numbers</h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full max-w-sm relative"
        >
          <div className="bg-white/80 backdrop-blur-xl p-6 rounded-[2rem] shadow-2xl border-2 border-[#FFCCE1]">
            {/* Display */}
            <div className="bg-[#FFF5D7] rounded-3xl p-6 mb-6 border-2 border-[#FFCCE1] text-right flex flex-col justify-end min-h-[120px] shadow-inner">
              <div className="text-[#E195AB] text-sm h-6 font-mono tracking-wider overflow-hidden">
                {equation}
              </div>
              <div className="text-4xl sm:text-5xl font-bold font-mono text-slate-800 truncate tracking-tight mt-1">
                {display}
              </div>
            </div>

            {/* Keypad */}
            <div className="grid grid-cols-4 gap-3">
              <button onClick={clear} className={actBtnClass}>AC</button>
              <button onClick={toggleSign} className={actBtnClass}>+/-</button>
              <button onClick={handlePercent} className={actBtnClass}>%</button>
              <button onClick={() => handleOperator('/')} className={opBtnClass}>÷</button>

              <button onClick={() => handleNumber('7')} className={numBtnClass}>7</button>
              <button onClick={() => handleNumber('8')} className={numBtnClass}>8</button>
              <button onClick={() => handleNumber('9')} className={numBtnClass}>9</button>
              <button onClick={() => handleOperator('*')} className={opBtnClass}>×</button>

              <button onClick={() => handleNumber('4')} className={numBtnClass}>4</button>
              <button onClick={() => handleNumber('5')} className={numBtnClass}>5</button>
              <button onClick={() => handleNumber('6')} className={numBtnClass}>6</button>
              <button onClick={() => handleOperator('-')} className={opBtnClass}>-</button>

              <button onClick={() => handleNumber('1')} className={numBtnClass}>1</button>
              <button onClick={() => handleNumber('2')} className={numBtnClass}>2</button>
              <button onClick={() => handleNumber('3')} className={numBtnClass}>3</button>
              <button onClick={() => handleOperator('+')} className={opBtnClass}>+</button>

              <button onClick={() => handleNumber('0')} className={`${numBtnClass} col-span-2 !aspect-auto`}>0</button>
              <button onClick={() => handleNumber('.')} className={numBtnClass}>.</button>
              <button onClick={initiateCalculation} className={opBtnClass}>=</button>
            </div>
          </div>
          
          {/* Payment Modal Overlay */}
          <AnimatePresence>
            {showPayment && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-white/40 backdrop-blur-md rounded-[2rem]"
              >
                <motion.div
                  initial={{ scale: 0.9, y: 10 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.9, y: 10 }}
                  className="bg-white p-6 rounded-3xl shadow-2xl border-2 border-black text-center w-full max-w-[95%] sm:max-w-md"
                >
                  {paymentSuccess ? (
                    <div className="flex flex-col items-center py-4">
                      <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
                      <h3 className="text-xl font-bold text-slate-800">Pembayaran Berhasil!</h3>
                      <p className="text-slate-500 text-sm mt-2">Menampilkan hasil...</p>
                    </div>
                  ) : (
                    <>
                      <div className="mx-auto w-auto inline-block mb-2">
                        <div className="bg-red-600 text-white font-black italic tracking-tighter text-2xl px-5 py-1 rounded-xl shadow-md border-2 border-black">
                          QRIS
                        </div>
                      </div>
                      <h3 className="text-xl font-bold text-slate-800 mb-1 leading-tight">Scan untuk melihat hasil</h3>
                      <p className="text-slate-500 text-xs mb-4 leading-relaxed px-2">
                        Biaya dihitung berdasarkan tingkat kesulitan soal. Scan menggunakan e-wallet atau m-banking Anda.
                      </p>
                      
                      <div className="bg-white border-4 border-slate-800 p-4 rounded-3xl mb-4 inline-block shadow-sm relative overflow-hidden w-40 h-40 sm:w-48 sm:h-48 flex items-center justify-center">
                        <QrCode className="w-full h-full text-slate-800" strokeWidth={1.5} />
                        {isProcessing && (
                          <motion.div
                            initial={{ top: '-50%', opacity: 0 }}
                            animate={{ top: ['-10%', '110%', '-10%'], opacity: [0, 1, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            className="absolute left-0 right-0 h-1/2 pointer-events-none"
                            style={{
                              background: 'linear-gradient(to bottom, rgba(239, 68, 68, 0) 0%, rgba(239, 68, 68, 0.2) 90%, rgba(239, 68, 68, 0.8) 100%)',
                              borderBottom: '3px solid #ef4444',
                              boxShadow: '0 4px 15px rgba(239, 68, 68, 0.6)'
                            }}
                          />
                        )}
                      </div>

                      <div className="text-3xl font-black text-[#FF00E5] mb-6">
                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price)}
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={handlePayment}
                          disabled={isProcessing}
                          className="w-full bg-[#FF00E5] text-white font-bold py-3 px-4 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden relative"
                        >
                          {isProcessing ? (
                            <motion.div 
                              className="flex items-center gap-2"
                              initial={{ opacity: 0.5 }}
                              animate={{ opacity: 1 }}
                              transition={{ repeat: Infinity, duration: 0.8, direction: "alternate" }}
                            >
                              <div className="w-2 h-2 rounded-full bg-white animate-ping"></div>
                              <span>Memverifikasi...</span>
                            </motion.div>
                          ) : (
                            <>
                              <ScanFace className="w-5 h-5" />
                              <span>Simulasi Scan QRIS</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => setShowPayment(false)}
                          disabled={isProcessing}
                          className="w-full text-slate-500 font-bold py-3 hover:text-slate-800 transition-colors text-sm"
                        >
                          Batal
                        </button>
                      </div>
                    </>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

        </motion.div>

      </div>
    </section>
  );
};
