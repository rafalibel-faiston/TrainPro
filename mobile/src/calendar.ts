import { Platform } from 'react-native';
import * as Calendar from 'expo-calendar';

// Adiciona um evento à agenda do aparelho (que sincroniza com o Google/iCloud
// conforme a conta configurada no celular).
export async function addToCalendar(
  title: string,
  start: Date,
  end: Date,
  notes?: string,
): Promise<void> {
  const { status } = await Calendar.requestCalendarPermissionsAsync();
  if (status !== 'granted') throw new Error('Permissão de agenda negada.');

  let calendarId: string | undefined;
  if (Platform.OS === 'ios') {
    const def = await Calendar.getDefaultCalendarAsync();
    calendarId = def?.id;
  } else {
    const cals = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    const writable = cals.filter((c) => c.allowsModifications);
    const primary =
      writable.find((c) => c.isPrimary) ||
      writable.find((c) => c.accessLevel === Calendar.CalendarAccessLevel.OWNER) ||
      writable[0];
    calendarId = primary?.id;
  }

  if (!calendarId) throw new Error('Nenhuma agenda disponível no aparelho.');

  await Calendar.createEventAsync(calendarId, {
    title,
    startDate: start,
    endDate: end,
    notes,
  });
}
