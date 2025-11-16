import { logger } from '@/utils/logger';
interface HourEntry {
  date: string;
  object: string;
  hours: number;
  businessTrip: boolean;
  earnings: number;
}

interface ProcessEntry {
  date: string;
  name: string;
  object: string;
  volume: number;
  unit: string;
  rate: number;
  earnings: number;
}

interface EmployeeReport {
  employeeId: string;
  employeeName: string;
  hourlyRate: number;
  hours: HourEntry[];
  processes: ProcessEntry[];
}

const MAX_COLS = 8;

const padRow = (row: any[]): any[] => {
  while (row.length < MAX_COLS) {
    row.push('');
  }
  return row.slice(0, MAX_COLS);
};


export async function exportEmployeeReport(
  report: EmployeeReport,
  month: string
) {
  try {
    const sheetName = `${report.employeeName} ${month}`;
    const data: any[][] = [];

    // Заголовок звіту
    data.push(padRow([`ЗВІТ: ${report.employeeName} за ${month}`]));
    data.push(padRow([]));

    // Години
    let totalHours = 0;
    let totalRegularHours = 0;
    let totalOvertimeHours = 0;
    let totalHoursEarnings = 0;

    if (report.hours.length > 0) {
      data.push(padRow(['Дата', 'Години', 'Заробіток']));

      const hoursByDate = new Map<string, HourEntry[]>();
      report.hours.forEach(hour => {
        if (!hoursByDate.has(hour.date)) {
          hoursByDate.set(hour.date, []);
        }
        hoursByDate.get(hour.date)!.push(hour);
      });

      hoursByDate.forEach((dateHours) => {
        const dailyTotal = dateHours.reduce((sum, h) => sum + h.hours, 0);
        const dailyEarnings = dateHours.reduce((sum, h) => sum + h.earnings, 0);

        // Основний рядок з датою
        data.push(padRow([
          dateHours[0].date,
          dailyTotal.toString(),
          dailyEarnings.toString()
        ]));

        // Підрядки з деталями (звичайні/понаднормові)
        let dailyRegular = 0;
        let dailyOvertime = 0;

        if (dailyTotal > 8) {
          dailyRegular = 8;
          dailyOvertime = dailyTotal - 8;
          totalRegularHours += 8;
          totalOvertimeHours += dailyTotal - 8;
        } else {
          dailyRegular = dailyTotal;
          totalRegularHours += dailyTotal;
        }

        // Додаємо деталі під датою
        data.push(padRow(['  Звичайні', dailyRegular.toString()]));
        if (dailyOvertime > 0) {
          data.push(padRow(['  Понаднормові', dailyOvertime.toString()]));
        }

        totalHours += dailyTotal;
        totalHoursEarnings += dailyEarnings;
      });

      data.push(padRow([]));
    }

    // Процеси за об'єктами
    const processesByObject = new Map<string, ProcessEntry[]>();
    report.processes.forEach(process => {
      if (!processesByObject.has(process.object)) {
        processesByObject.set(process.object, []);
      }
      processesByObject.get(process.object)!.push(process);
    });

    let totalProcessEarnings = 0;

    if (processesByObject.size > 0) {
      data.push(padRow(['ПРОЦЕСИ']));
      data.push(padRow([]));

      for (const [object, processes] of processesByObject) {
        data.push(padRow([`ОБ'ЄКТ: ${object}`]));
        data.push(padRow(['Дата', 'Процес', 'Обсяг', 'Одиниця', 'Ставка', 'Заробіток']));

        let objectEarnings = 0;

        processes.forEach(process => {
          data.push(padRow([
            process.date,
            process.name,
            process.volume.toString(),
            process.unit,
            process.rate.toString(),
            process.earnings.toString()
          ]));
          objectEarnings += process.earnings;
        });

        data.push(padRow(['РАЗОМ:', '', '', '', '', objectEarnings.toString()]));
        data.push(padRow([]));

        totalProcessEarnings += objectEarnings;
      }
    }

    // Загальна статистика
    data.push(padRow([]));
    data.push(padRow(['ПІДСУМОК']));
    data.push(padRow(['Всього годин', totalHours.toString()]));
    data.push(padRow(['  Звичайні', totalRegularHours.toString()]));
    data.push(padRow(['  Понаднормові', totalOvertimeHours.toString()]));
    data.push(padRow(['Заробіток', (totalHoursEarnings + totalProcessEarnings).toString()]));

    logger.info('📤 Exporting employee report:', {
      sheetName,
      rowCount: data.length,
      colCount: MAX_COLS
    });

    // Записуємо в Google Sheets
    await fetch(import.meta.env.VITE_GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'append',
        spreadsheetId: import.meta.env.VITE_SPREADSHEET_ID,
        range: `${sheetName}!A1`,
        values: data
      })
    });

    logger.info('✅ Employee report exported successfully');
    return true;
  } catch (error) {
    logger.error('❌ Failed to export employee report:', error);
    throw error;
  }
}

export async function exportTeamReport(
  teamData: Array<{
    employeeName: string;
    hours: HourEntry[];
    processes: ProcessEntry[];
  }>,
  month: string
) {
  try {
    const sheetName = `Звіт команди ${month}`;
    const data: any[][] = [];

    // Заголовок
    data.push(padRow([`ЗВІТ КОМАНДИ за ${month}`]));
    data.push(padRow([]));

    // Побудуємо структуру: для кожного працівника - години, потім процеси
    for (const emp of teamData) {
      data.push(padRow([`ПРАЦІВНИК: ${emp.employeeName}`]));

      // Години
      if (emp.hours.length > 0) {
        data.push(padRow(['Дата', 'Години', 'Заробіток']));

        const hoursByDate = new Map<string, HourEntry[]>();
        emp.hours.forEach(hour => {
          if (!hoursByDate.has(hour.date)) {
            hoursByDate.set(hour.date, []);
          }
          hoursByDate.get(hour.date)!.push(hour);
        });

        let empTotalHours = 0;
        let empTotalRegularHours = 0;
        let empTotalOvertimeHours = 0;
        let empTotalHoursEarnings = 0;

        hoursByDate.forEach((dateHours) => {
          const dailyTotal = dateHours.reduce((sum, h) => sum + h.hours, 0);
          const dailyEarnings = dateHours.reduce((sum, h) => sum + h.earnings, 0);

          // Основний рядок з датою
          data.push(padRow([
            dateHours[0].date,
            dailyTotal.toString(),
            dailyEarnings.toString()
          ]));

          // Підрядки з деталями
          let dailyRegular = 0;
          let dailyOvertime = 0;

          if (dailyTotal > 8) {
            dailyRegular = 8;
            dailyOvertime = dailyTotal - 8;
            empTotalRegularHours += 8;
            empTotalOvertimeHours += dailyTotal - 8;
          } else {
            dailyRegular = dailyTotal;
            empTotalRegularHours += dailyTotal;
          }

          // Додаємо деталі під датою
          data.push(padRow(['  Звичайні', dailyRegular.toString()]));
          if (dailyOvertime > 0) {
            data.push(padRow(['  Понаднормові', dailyOvertime.toString()]));
          }

          empTotalHours += dailyTotal;
          empTotalHoursEarnings += dailyEarnings;
        });

        data.push(padRow(['Всього годин:', empTotalHours.toString(), 'Звичайні:', empTotalRegularHours.toString(), 'Понаднормові:', empTotalOvertimeHours.toString()]));
        data.push(padRow([]));
      }

      // Процеси за об'єктами
      const processesByObject = new Map<string, ProcessEntry[]>();
      emp.processes.forEach(process => {
        if (!processesByObject.has(process.object)) {
          processesByObject.set(process.object, []);
        }
        processesByObject.get(process.object)!.push(process);
      });

      if (processesByObject.size > 0) {
        data.push(padRow(['ПРОЦЕСИ']));
        data.push(padRow([]));

        let empTotalProcessEarnings = 0;

        for (const [object, processes] of processesByObject) {
          data.push(padRow([`ОБ'ЄКТ: ${object}`]));
          data.push(padRow(['Дата', 'Процес', 'Обсяг', 'Одиниця', 'Ставка', 'Заробіток']));

          let objectEarnings = 0;

          processes.forEach(process => {
            data.push(padRow([
              process.date,
              process.name,
              process.volume.toString(),
              process.unit,
              process.rate.toString(),
              process.earnings.toString()
            ]));
            objectEarnings += process.earnings;
          });

          data.push(padRow(['РАЗОМ:', '', '', '', '', objectEarnings.toString()]));
          data.push(padRow([]));

          empTotalProcessEarnings += objectEarnings;
        }

        data.push(padRow(['Всього процесів за працівником:', '', '', '', '', empTotalProcessEarnings.toString()]));
        data.push(padRow([]));
      }

      data.push(padRow([]));
    }

    // Загальна статистика команди
    let teamTotalRegularHours = 0;
    let teamTotalOvertimeHours = 0;
    let teamTotalHoursEarnings = 0;
    let teamTotalProcessEarnings = 0;

    for (const emp of teamData) {
      const hoursByDate = new Map<string, HourEntry[]>();
      emp.hours.forEach(hour => {
        if (!hoursByDate.has(hour.date)) {
          hoursByDate.set(hour.date, []);
        }
        hoursByDate.get(hour.date)!.push(hour);
      });

      hoursByDate.forEach((dateHours) => {
        const dailyTotal = dateHours.reduce((sum, h) => sum + h.hours, 0);
        const dailyEarnings = dateHours.reduce((sum, h) => sum + h.earnings, 0);

        if (dailyTotal > 8) {
          teamTotalRegularHours += 8;
          teamTotalOvertimeHours += dailyTotal - 8;
        } else {
          teamTotalRegularHours += dailyTotal;
        }

        teamTotalHoursEarnings += dailyEarnings;
      });

      emp.processes.forEach(process => {
        teamTotalProcessEarnings += process.earnings;
      });
    }

    data.push(padRow([]));
    data.push(padRow(['ЗАГАЛОМ КОМАНДА']));
    data.push(padRow(['Всього звичайних', teamTotalRegularHours.toString()]));
    data.push(padRow(['Всього понаднормових', teamTotalOvertimeHours.toString()]));
    data.push(padRow(['Заробіток', (teamTotalHoursEarnings + teamTotalProcessEarnings).toString()]));

    logger.info('📤 Exporting team report:', {
      sheetName,
      rowCount: data.length,
      colCount: MAX_COLS
    });

    // Записуємо в Google Sheets
    await fetch(import.meta.env.VITE_GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'append',
        spreadsheetId: import.meta.env.VITE_SPREADSHEET_ID,
        range: `${sheetName}!A1`,
        values: data
      })
    });

    logger.info('✅ Team report exported successfully');
    return true;
  } catch (error) {
    logger.error('❌ Failed to export team report:', error);
    throw error;
  }
}
