import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { useData } from '@/contexts/DataContext';
import { getTelegramUserId } from '@/utils/telegramWebApp';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { logger } from '@/utils/logger';

export default function WelcomeScreen() {
  const { user, isRegistered, setUser } = useUser();
  const { users } = useData();
  const navigate = useNavigate();

  useEffect(() => {
    if (isRegistered && user) {
      navigate(user.role === 'employee' ? '/employee' : '/manager');
      return;
    }

    const tgUserId = getTelegramUserId();
    if (tgUserId && users.length > 0) {
      const existingUser = users.find(u => u.telegramId === tgUserId);
      if (existingUser) {
        logger.info('✅ Auto-login via Telegram ID', { userId: existingUser.id, telegramId: tgUserId });
        setUser(existingUser);
        navigate(existingUser.role === 'employee' ? '/employee' : '/manager');
      }
    }
  }, [isRegistered, user, users, setUser, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20">
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="text-6xl mb-4"
            >
              ⏰
            </motion.div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Облік Часу
            </h1>
            <p className="text-white/80 text-sm">
              Керуйте робочими годинами та процесами
            </p>
          </div>

          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Button
                onClick={() => navigate('/employee?register=true')}
                className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white rounded-2xl shadow-lg transition-all duration-300 hover:scale-105"
              >
                <span className="mr-2">👤</span>
                Я Працівник
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Button
                onClick={() => navigate('/manager?register=true')}
                className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white rounded-2xl shadow-lg transition-all duration-300 hover:scale-105"
              >
                <span className="mr-2">👔</span>
                Я Менеджер
              </Button>
            </motion.div>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center text-white/60 text-xs mt-8"
          >
            Оберіть свою роль для початку роботи
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
}