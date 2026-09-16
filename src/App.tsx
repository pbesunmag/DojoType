import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { 
  fetchPokemon, 
  fetchAttackerForType, 
  getRandomPokemonId, 
  checkEffectiveness, 
  getRandomOptions, 
  GENERATIONS, 
  getAvailableTypes,
  TYPE_COLORS 
} from './utils/pokemon';
import { Pokemon, GenerationKey } from './types';
import { TypeButton } from './components/TypeButton';

function App() {
  const [inGame, setInGame] = useState(false);
  const [generation, setGeneration] = useState<GenerationKey>('gen3');
  const [defender, setDefender] = useState<Pokemon | null>(null);
  const [attacker, setAttacker] = useState<Pokemon | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [feedback, setFeedback] = useState<{ msg: string, success: boolean } | null>(null);
  const [animating, setAnimating] = useState(false);

  const currentGenConfig = GENERATIONS[generation];

  const initRound = async () => {
    setLoading(true);
    setFeedback(null);
    setAnimating(false);

    try {
      const activeTypes = getAvailableTypes(currentGenConfig.hasFairy);
      const id = getRandomPokemonId(currentGenConfig.maxId);
      const poke = await fetchPokemon(id);

      const cleanedTypes = currentGenConfig.hasFairy 
        ? poke.types 
        : poke.types.map(t => t === 'fairy' ? 'normal' : t);

      const defenderWithGenTypes = { ...poke, types: cleanedTypes };
      setDefender(defenderWithGenTypes);

      const superEffectiveTypes = activeTypes.filter(
        type => checkEffectiveness(type, defenderWithGenTypes.types) > 1
      );

      let guaranteed: string | undefined = undefined;
      if (superEffectiveTypes.length > 0) {
        guaranteed = superEffectiveTypes[Math.floor(Math.random() * superEffectiveTypes.length)];
      }

      if (guaranteed) {
        const attackerPoke = await fetchAttackerForType(guaranteed);
        setAttacker(attackerPoke);
      }

      setOptions(getRandomOptions(activeTypes, guaranteed));
    } catch (error) {
      console.error('Error al cargar la ronda:', error);
    } finally {
      setLoading(false);
    }
  };

  const startGame = (selectedGen: GenerationKey) => {
    setGeneration(selectedGen);
    setStreak(0);
    setInGame(true);
  };

  useEffect(() => {
    if (inGame) {
      initRound();
    }
  }, [inGame, generation]);

  const handleAttack = (chosenType: string) => {
    if (!defender || animating) return;
    setAnimating(true);

    const multiplier = checkEffectiveness(chosenType, defender.types);

    if (multiplier > 1) {
      setFeedback({ msg: `¡Es muy eficaz! (x${multiplier})`, success: true });
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      setStreak(s => {
        const newS = s + 1;
        if (newS > maxStreak) setMaxStreak(newS);
        return newS;
      });
    } else {
      const reason = multiplier === 1 
        ? 'Es daño normal (x1)' 
        : multiplier === 0 
          ? 'No afecta (x0)' 
          : 'No es muy eficaz (x0.5 o x0.25)';
      
      setFeedback({ msg: `¡Oh no! ${reason}`, success: false });
      setStreak(0);
    }

    setTimeout(() => {
      initRound();
    }, 2200);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-3 sm:p-4 font-pokemon text-sm select-none">
      <div className="max-w-2xl w-full bg-white text-black rounded-lg overflow-hidden shadow-2xl border-4 border-gray-700">
        
        {/* MENÚ DE INICIO */}
        {!inGame ? (
          <div className="p-6 sm:p-8 flex flex-col items-center text-center space-y-6 bg-gradient-to-b from-gray-800 to-gray-900 text-white min-h-[460px] justify-center">
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl text-yellow-400 tracking-wider">DOJOTYPE</h1>
              <p className="text-xs text-gray-300">Entrenamiento de Efectividad Elemental</p>
            </div>

            <div className="w-full max-w-md space-y-3">
              <p className="text-xs text-gray-400 uppercase tracking-widest pb-1">Selecciona Modo / Generación:</p>
              
              {Object.entries(GENERATIONS).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => startGame(key as GenerationKey)}
                  className="w-full bg-gray-700 hover:bg-yellow-500 hover:text-black border-2 border-gray-500 hover:border-black p-3.5 rounded text-left transition-all duration-150 flex justify-between items-center group shadow-md"
                >
                  <div>
                    <p className="text-xs sm:text-sm font-bold">{config.name}</p>
                    <p className="text-[10px] text-gray-300 group-hover:text-gray-900">
                      {config.hasFairy ? '18 tipos (Con tipo Hada)' : '17 tipos (Sin tipo Hada)'}
                    </p>
                  </div>
                  <span className="text-sm group-hover:translate-x-1 transition-transform">▶</span>
                </button>
              ))}
            </div>

            {maxStreak > 0 && (
              <p className="text-xs text-green-400">Récord de sesión: {maxStreak} aciertos</p>
            )}
          </div>
        ) : (
          /* ARENA ESTILO ROJO FUEGO / GBA */
          <>
            {/* Header */}
            <div className="bg-gray-800 text-white p-3 flex justify-between items-center border-b-4 border-gray-700">
              <div className="flex gap-4 text-xs">
                <p>Racha: {streak}</p>
                <p>Récord: {maxStreak}</p>
              </div>
              <button 
                onClick={() => setInGame(false)}
                className="bg-gray-700 hover:bg-red-600 px-3 py-1 text-[11px] rounded border border-gray-500 transition-colors"
              >
                Menú
              </button>
            </div>

            {/* Escenario de Batalla */}
            <div className="relative h-72 sm:h-80 bg-gradient-to-b from-sky-200 via-emerald-100 to-emerald-400 overflow-hidden">
              
              {/* CAJA DE DATOS DEL RIVAL */}
              <div className="absolute top-4 left-4 z-10 w-44 sm:w-52 bg-[#f8f9fa] border-2 border-gray-800 rounded-lg p-2 shadow-md">
                <div className="flex justify-between items-center text-[10px] sm:text-xs font-bold border-b border-gray-300 pb-1 uppercase">
                  <span>{defender?.name || '...'}</span>
                  <span className="text-gray-600 text-[9px]">Nv.50</span>
                </div>
                <div className="flex items-center gap-1 mt-1.5">
                  <span className="text-[8px] bg-yellow-500 text-black px-1 rounded font-bold">PS</span>
                  <div className="w-full bg-gray-300 h-2 rounded-full overflow-hidden border border-gray-500">
                    <div className="bg-green-500 h-full w-full"></div>
                  </div>
                </div>
                <div className="flex gap-1 mt-1.5">
                  {defender?.types.map(t => (
                    <span 
                      key={t} 
                      style={{ backgroundColor: TYPE_COLORS[t] || '#68A090' }}
                      className="text-[9px] px-1.5 py-0.5 text-white rounded uppercase font-bold shadow-sm"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* POKÉMON RIVAL */}
              <div className="absolute top-24 sm:top-20 right-6 sm:right-12 flex flex-col items-center">
                <div className="relative w-44 sm:w-52 h-20 flex items-center justify-center">
                  <div className="absolute bottom-1 w-full h-12 bg-emerald-700/80 rounded-[50%] border-4 border-emerald-900 shadow-inner"></div>
                  {defender && (
                    <motion.img 
                      key={defender.name}
                      animate={animating ? (feedback?.success ? { opacity: [1, 0.2, 1, 0.2], scale: 0.95 } : { x: [-8, 8, -8, 8, 0] }) : {}}
                      transition={{ duration: 0.5 }}
                      src={defender.spriteFront} 
                      alt={defender.name} 
                      className="absolute bottom-4 w-28 h-28 sm:w-32 sm:h-32 object-contain drop-shadow-md pointer-events-none"
                    />
                  )}
                </div>
              </div>

              {/* NUESTRO POKÉMON */}
              <div className="absolute bottom-2 left-4 sm:left-10 flex flex-col items-center">
                <div className="relative w-48 sm:w-56 h-24 flex items-center justify-center">
                  <div className="absolute bottom-2 w-full h-14 bg-emerald-600/90 rounded-[50%] border-4 border-emerald-800 shadow-inner"></div>
                  {attacker && (
                    <motion.img 
                      key={attacker.name}
                      animate={animating && feedback?.success ? { x: [0, 30, 0], y: [0, -15, 0] } : {}}
                      transition={{ duration: 0.35, ease: 'easeInOut' }}
                      src={attacker.spriteBack} 
                      alt={attacker.name} 
                      className="absolute bottom-5 w-32 h-32 sm:w-36 sm:h-36 object-contain drop-shadow-md pointer-events-none"
                    />
                  )}
                </div>
              </div>

              {/* NUESTRA CAJA DE DATOS */}
              <div className="absolute bottom-4 right-4 z-10 w-44 sm:w-52 bg-[#f8f9fa] border-2 border-gray-800 rounded-lg p-2 shadow-md">
                <div className="flex justify-between items-center text-[10px] sm:text-xs font-bold border-b border-gray-300 pb-1 uppercase">
                  <span>{attacker?.name || '...'}</span>
                  <span className="text-gray-600 text-[9px]">Nv.50</span>
                </div>
                <div className="flex items-center gap-1 mt-1.5">
                  <span className="text-[8px] bg-yellow-500 text-black px-1 rounded font-bold">PS</span>
                  <div className="w-full bg-gray-300 h-2 rounded-full overflow-hidden border border-gray-500">
                    <div className="bg-green-500 h-full w-full"></div>
                  </div>
                </div>
                <div className="flex gap-1 mt-1.5">
                  {attacker?.types.map(t => (
                    <span 
                      key={t} 
                      style={{ backgroundColor: TYPE_COLORS[t] || '#68A090' }}
                      className="text-[9px] px-1.5 py-0.5 text-white rounded uppercase font-bold shadow-sm"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Feedback Overlay */}
              <AnimatePresence>
                {feedback && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] z-20"
                  >
                    <div className={`p-4 border-4 rounded bg-white text-center mx-4 shadow-xl ${feedback.success ? 'border-green-500 text-green-700' : 'border-red-500 text-red-700'}`}>
                      <h2 className="text-base sm:text-lg mb-1">{feedback.success ? '¡Éxito!' : '¡Fallaste!'}</h2>
                      <p className="text-xs sm:text-sm">{feedback.msg}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {loading && !feedback && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-20">
                  <p className="text-white animate-pulse text-xs">Preparando rival...</p>
                </div>
              )}
            </div>

            {/* Botones de Ataque */}
            <div className="p-4 bg-gray-100 border-t-4 border-gray-700">
              <p className="text-center mb-3 text-xs text-gray-700 font-bold">Elige un tipo de ataque con ventaja:</p>
              <div className="grid grid-cols-2 gap-3">
                {options.map(type => (
                  <TypeButton key={type} type={type} onClick={handleAttack} disabled={animating || loading} />
                ))}
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}

export default App;