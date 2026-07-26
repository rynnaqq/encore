import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Chess, Square } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { motion } from 'motion/react';
import { Trophy, RefreshCw, Cpu, User } from 'lucide-react';

export const ChessGameSection: React.FC = () => {
  const [game, setGame] = useState(new Chess());
  const [fen, setFen] = useState(game.fen());
  const [gameStatus, setGameStatus] = useState<string>('Menunggu langkah pertama Anda...');
  const [botLevel, setBotLevel] = useState(20);
  const engine = useRef<Worker | null>(null);
  const [isBotThinking, setIsBotThinking] = useState(false);

  const [moveFrom, setMoveFrom] = useState<string | null>(null);
  const [optionSquares, setOptionSquares] = useState({});

  useEffect(() => {
    const initEngine = () => {
      try {
        const workerCode = `importScripts("https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js");`;
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        const url = URL.createObjectURL(blob);
        const worker = new Worker(url);
        engine.current = worker;

        worker.onmessage = (event) => {
          const line = typeof event.data === 'string' ? event.data : '';
          
          if (line.startsWith('bestmove')) {
            const match = line.match(/^bestmove\s+([a-h][1-8])([a-h][1-8])([qrbn])?/);
            if (match) {
              const move = {
                from: match[1],
                to: match[2],
                ...(match[3] ? { promotion: match[3] } : {})
              };
              makeBotMove(move);
            }
          }
        };

        worker.postMessage('uci');
        worker.postMessage(`setoption name Skill Level value ${botLevel}`);
        worker.postMessage('isready');
      } catch (error) {
        console.error("Failed to load Stockfish engine", error);
      }
    };

    initEngine();

    return () => {
      if (engine.current) {
        engine.current.terminate();
      }
    };
  }, []);

  const makeBotMove = (move: { from: string; to: string; promotion?: string }) => {
    setGame((prevGame) => {
      try {
        const newGame = new Chess(prevGame.fen());
        const result = newGame.move(move);
        if (result) {
          // Schedule state updates outside the updater to avoid side effects during render phase
          setTimeout(() => {
            setFen(newGame.fen());
            updateGameStatus(newGame);
            setIsBotThinking(false);
          }, 0);
          return newGame;
        }
      } catch (e) {
        console.error(e);
      }
      setIsBotThinking(false);
      return prevGame;
    });
  };

  const updateGameStatus = (currentGame: Chess) => {
    if (currentGame.isCheckmate()) {
      setGameStatus(`Skakmat! ${currentGame.turn() === 'w' ? 'Hitam (Bot)' : 'Putih (Anda)'} menang!`);
    } else if (currentGame.isDraw()) {
      setGameStatus('Seri!');
    } else if (currentGame.isStalemate()) {
      setGameStatus('Buntu (Stalemate)!');
    } else if (currentGame.isCheck()) {
      setGameStatus('Skak!');
    } else {
      setGameStatus(`Giliran ${currentGame.turn() === 'w' ? 'Putih (Anda)' : 'Hitam (Bot)'}`);
    }
  };

  const findBestMove = useCallback((currentGame: Chess) => {
    if (engine.current && !currentGame.isGameOver()) {
      setIsBotThinking(true);
      engine.current.postMessage(`position fen ${currentGame.fen()}`);
      engine.current.postMessage('go depth 15'); 
    }
  }, []);

  function getMoveOptions(square: Square) {
    const moves = game.moves({
      square,
      verbose: true,
    });
    if (moves.length === 0) {
      setOptionSquares({});
      return false;
    }

    const newSquares: Record<string, React.CSSProperties> = {};
    moves.map((move) => {
      newSquares[move.to] = {
        background:
          game.get(move.to as Square) && game.get(move.to as Square)?.color !== game.get(square)?.color
            ? 'radial-gradient(circle, rgba(0,0,0,.1) 85%, transparent 85%)'
            : 'radial-gradient(circle, rgba(0,0,0,.1) 25%, transparent 25%)',
        borderRadius: '50%',
      };
      return move;
    });
    newSquares[square] = {
      background: 'rgba(255, 255, 0, 0.4)',
    };
    setOptionSquares(newSquares);
    return true;
  }

  function onSquareClick(square: Square) {
    if (game.turn() !== 'w' || isBotThinking || game.isGameOver()) return;

    if (!moveFrom) {
      const hasMoveOptions = getMoveOptions(square);
      if (hasMoveOptions) setMoveFrom(square);
      return;
    }

    if (!optionSquares[square as keyof typeof optionSquares] && moveFrom !== square) {
      const hasMoveOptions = getMoveOptions(square);
      if (hasMoveOptions) setMoveFrom(square);
      else {
        setMoveFrom(null);
        setOptionSquares({});
      }
      return;
    }

    try {
      const newGame = new Chess(game.fen());
      const move = newGame.move({
        from: moveFrom,
        to: square,
        promotion: 'q', 
      });

      if (move === null) {
        const hasMoveOptions = getMoveOptions(square);
        if (hasMoveOptions) setMoveFrom(square);
        else {
          setMoveFrom(null);
          setOptionSquares({});
        }
        return;
      }
      
      setGame(newGame);
      setFen(newGame.fen());
      updateGameStatus(newGame);
      setMoveFrom(null);
      setOptionSquares({});

      if (!newGame.isGameOver()) {
        setTimeout(() => findBestMove(newGame), 300);
      }
    } catch (e) {
      const hasMoveOptions = getMoveOptions(square);
      if (hasMoveOptions) setMoveFrom(square);
      else {
        setMoveFrom(null);
        setOptionSquares({});
      }
    }
  }

  const onDrop = (sourceSquare: Square, targetSquare: Square) => {
    if (game.turn() !== 'w' || isBotThinking || game.isGameOver()) return false;

    try {
      const newGame = new Chess(game.fen());
      const move = newGame.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q', 
      });

      if (move === null) return false;
      
      setGame(newGame);
      setFen(newGame.fen());
      updateGameStatus(newGame);
      setMoveFrom(null);
      setOptionSquares({});

      if (!newGame.isGameOver()) {
        setTimeout(() => findBestMove(newGame), 300);
      }
      return true;
    } catch (e) {
      return false;
    }
  };

  const resetGame = () => {
    const newGame = new Chess();
    setGame(newGame);
    setFen(newGame.fen());
    setGameStatus('Menunggu langkah pertama Anda...');
    setIsBotThinking(false);
    setMoveFrom(null);
    setOptionSquares({});
  };

  return (
    <section id="chess" className="min-h-screen w-full relative overflow-hidden bg-[#0f0f11] pt-24 pb-12 flex flex-col items-center">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent pointer-events-none" />
      
      <div className="max-w-4xl w-full px-4 sm:px-6 z-10">
        
        <div className="text-center mb-8">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
            Tantang Aku Saja
          </h2>
        </div>

        <div className="bg-[#18181b] border-2 border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row gap-8 items-center md:items-start">
          
          <div className="w-full max-w-[500px] flex-shrink-0 bg-[#27272a] p-3 rounded-2xl border-2 border-slate-700 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)]">
            <Chessboard 
              position={fen} 
              onPieceDrop={onDrop}
              onSquareClick={onSquareClick}
              customSquareStyles={optionSquares}
              boardOrientation="white"
              customDarkSquareStyle={{ backgroundColor: '#779556' }}
              customLightSquareStyle={{ backgroundColor: '#ebecd0' }}
              animationDuration={200}
            />
          </div>

          <div className="flex-1 w-full flex flex-col gap-6">
            
            <div className="flex flex-col gap-4 bg-[#27272a] p-5 rounded-2xl border border-slate-800">
              
              <div className="flex items-center justify-between p-3 bg-slate-900 rounded-xl border border-slate-700 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-500/20 text-indigo-400 rounded-lg flex items-center justify-center">
                    <Cpu className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-200">Stockfish Bot</h3>
                    <p className="text-xs text-slate-400">Elo: ~3000 (Level Max)</p>
                  </div>
                </div>
                {isBotThinking && (
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                )}
              </div>

              <div className="py-2 text-center border-y border-slate-700">
                <p className={`font-bold text-lg ${game.isCheckmate() ? 'text-red-400' : 'text-[#f4f4f5]'}`}>
                  {gameStatus}
                </p>
              </div>

              <div className="flex items-center gap-3 p-3 bg-slate-900 rounded-xl border border-slate-700 shadow-sm">
                <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-lg flex items-center justify-center">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-200">Anda (Putih)</h3>
                  <p className="text-xs text-slate-400">Berikan yang terbaik!</p>
                </div>
              </div>

            </div>

            <button 
              onClick={resetGame}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] transition-all text-lg"
            >
              <RefreshCw className="w-5 h-5" />
              Main Ulang
            </button>

          </div>
        </div>
      </div>
    </section>
  );
};
