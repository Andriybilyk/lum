import { useMemo, useEffect, useRef } from 'react';
import { useData } from '@/contexts/DataContext';
import { useUser } from '@/contexts/UserContext';
import { useNotification } from '@/contexts/NotificationContext';

interface Anomaly {
  id: string;
  userId: string;
  userName: string;
  type: 'excessive_hours' | 'duplicate' | 'multiple_objects';
  severity: 'low' | 'medium' | 'high';
  description: string;
  details: any;
  date: string;
}

interface AnomaliesStats {
  anomalies: Anomaly[];
  high: number;
  medium: number;
  low: number;
  total: number;
}

/**
 * Хук для автоматичної перевірки аномалій у записах годин
 * Автоматично виявляє проблеми та надсилає сповіщення менеджеру
 */
export function useAnomaliesDetection(): AnomaliesStats {
  const { users, hours } = useData();
  const { user } = useUser();
  const { warning, error } = useNotification();
  const notifiedAnomaliesRef = useRef<Set<string>>(new Set());

  const anomalies = useMemo(() => {
    const detected: Anomaly[] = [];

    // 1. Перевірка на занадто багато годин за день (>14)
    const hoursByDay: Record<string, any[]> = {};
    hours.forEach(h => {
      const key = `${h.userId}-${h.date}`;
      if (!hoursByDay[key]) hoursByDay[key] = [];
      hoursByDay[key].push(h);
    });

    Object.entries(hoursByDay).forEach(([key, dayHours]) => {
      const total = dayHours.reduce((sum, h) => sum + h.hours, 0);
      if (total > 14) {
        const foundUser = users.find(u => u.id === dayHours[0].userId);
        detected.push({
          id: `excessive-${key}`,
          userId: dayHours[0].userId,
          userName: foundUser?.name || 'Невідомий',
          type: 'excessive_hours',
          severity: 'high',
          description: `${total} годин за день - можлива помилка`,
          details: {
            date: dayHours[0].date,
            hours: total,
            entries: dayHours.length
          },
          date: dayHours[0].date
        });
      }
    });

    // 2. Дублікати (однакові записи в один день)
    const seen = new Set<string>();
    hours.forEach(h => {
      const signature = `${h.userId}-${h.date}-${h.object}-${h.hours}`;

      hours.forEach(h2 => {
        const signature2 = `${h2.userId}-${h2.date}-${h2.object}-${h2.hours}`;
        if (h.id !== h2.id && signature === signature2 && !seen.has(signature)) {
          const foundUser = users.find(u => u.id === h.userId);
          detected.push({
            id: `duplicate-${h.id}-${h2.id}`,
            userId: h.userId,
            userName: foundUser?.name || 'Невідомий',
            type: 'duplicate',
            severity: 'high',
            description: 'Можливий дублікат запису',
            details: {
              date: h.date,
              object: h.object,
              hours: h.hours,
              count: 2
            },
            date: h.date
          });
          seen.add(signature);
        }
      });
    });

    // 3. Робота на кількох об'єктах в один день
    Object.entries(hoursByDay).forEach(([key, dayHours]) => {
      const objects = new Set(dayHours.map(h => h.object));
      if (objects.size > 1) {
        const foundUser = users.find(u => u.id === dayHours[0].userId);
        detected.push({
          id: `multiple-${key}`,
          userId: dayHours[0].userId,
          userName: foundUser?.name || 'Невідомий',
          type: 'multiple_objects',
          severity: 'medium',
          description: `Робота на ${objects.size} об'єктах в один день`,
          details: {
            date: dayHours[0].date,
            objects: Array.from(objects),
            totalHours: dayHours.reduce((sum, h) => sum + h.hours, 0)
          },
          date: dayHours[0].date
        });
      }
    });

    return detected.sort((a, b) => {
      // Сортуємо за важливістю, потім за датою
      const severityOrder = { high: 0, medium: 1, low: 2 };
      if (severityOrder[a.severity] !== severityOrder[b.severity]) {
        return severityOrder[a.severity] - severityOrder[b.severity];
      }
      return b.date.localeCompare(a.date);
    });
  }, [hours, users]);

  const stats = useMemo(() => {
    const high = anomalies.filter(a => a.severity === 'high').length;
    const medium = anomalies.filter(a => a.severity === 'medium').length;
    const low = anomalies.filter(a => a.severity === 'low').length;

    return { anomalies, high, medium, low, total: anomalies.length };
  }, [anomalies]);

  // Автоматичні сповіщення про критичні аномалії для менеджерів
  useEffect(() => {
    // Тільки для менеджерів
    if (!user || user.role !== 'manager') return;

    // Перевіряємо тільки нові критичні аномалії (за останні 24 години)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const recentCritical = anomalies.filter(a =>
      a.severity === 'high' && a.date >= yesterdayStr
    );

    // Перевіряємо тільки нові аномалії, про які ще не повідомляли
    const newAnomalies = recentCritical.filter(a => !notifiedAnomaliesRef.current.has(a.id));

    if (newAnomalies.length > 0) {
      const excessiveHours = newAnomalies.filter(a => a.type === 'excessive_hours');
      const duplicates = newAnomalies.filter(a => a.type === 'duplicate');

      if (excessiveHours.length > 0) {
        error(
          '⚠️ Виявлено аномалію!',
          `${excessiveHours.length} ${excessiveHours.length === 1 ? 'працівник має' : 'працівників мають'} понад 14 годин за день. Перевірте записи в розділі "Звіти".`,
          10000
        );
        // Відмічаємо, що вже повідомили про ці аномалії
        excessiveHours.forEach(a => notifiedAnomaliesRef.current.add(a.id));
      }

      if (duplicates.length > 0) {
        warning(
          '🔍 Можливі дублікати',
          `Виявлено ${duplicates.length} ${duplicates.length === 1 ? 'дублікат' : 'дублікатів'} у записах годин. Перевірте розділ "Звіти".`,
          8000
        );
        // Відмічаємо, що вже повідомили про ці аномалії
        duplicates.forEach(a => notifiedAnomaliesRef.current.add(a.id));
      }
    }
  }, [anomalies, user, error, warning]);

  return stats;
}
