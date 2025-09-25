import Papa from 'papaparse';

export interface CsvDayItinerary {
  day: number;
  date: string;
  title: string;
  activities: {
    time: string;
    title: string;
    type: string;
    description: string;
    image?: string;
  }[];
}

export interface CsvItineraryData {
  quoteId: string;
  name: string;
  days: number;
  nights: number;
  startDate: string;
  costINR: number;
  costUSD: number;
  guests: number;
  adults: number;
  kids: number;
  dailyItinerary: CsvDayItinerary[];
  locationMatched?: string;
}

// Update the fetchCsvData function in csvUtils.ts
export const fetchCsvData = async (quoteId: string): Promise<CsvItineraryData | null> => {
    try {
      const response = await fetch(`/Itinerary/${quoteId}.csv`);
      if (!response.ok) {
        throw new Error('Failed to fetch CSV data');
      }
      
      const csvText = await response.text();
      
      // Parse the CSV data with proper typing
      const { data } = Papa.parse<string[]>(csvText, {
        header: false,
        skipEmptyLines: true,
      });
  
      if (!data || data.length < 3) {
        throw new Error('Invalid CSV format');
      }
  
      // Process the parsed data into the expected format
      const headerRow = data[0];
      const result: CsvItineraryData = {
        quoteId: headerRow[0] || '',
        name: headerRow[1] || '',
        days: parseInt(headerRow[2] || '0', 10),
        nights: parseInt(headerRow[3] || '0', 10),
        startDate: headerRow[4] || '',
        costINR: parseFloat(headerRow[5] || '0'),
        costUSD: parseFloat(headerRow[6] || '0'),
        guests: parseInt(headerRow[7] || '0', 10),
        adults: parseInt(headerRow[8] || '0', 10),
        kids: parseInt(headerRow[9] || '0', 10),
        dailyItinerary: []
      };
  
      // Initialize variables for processing daily itinerary
      let currentDay: CsvDayItinerary | null = null;
      const dailyItinerary: CsvDayItinerary[] = [];

      // Process each row of the CSV
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row || !row[0]) continue;
  
        if (row[0].toLowerCase() === 'day' && row[1]) {
          // Handle day header
          if (currentDay) {
            dailyItinerary.push(currentDay);
          }
          currentDay = {
            day: parseInt(row[1], 10) || 1,
            date: row[2] || '',
            title: row[3] || `Day ${row[1] || '1'}`,
            activities: [],
          };
        } else if (currentDay && row[1] && row[2] && row[3]) {
          // Handle activity
          currentDay.activities.push({
            time: row[1] || '',
            title: row[2] || '',
            type: row[3] || 'activity',
            description: row[4] || '',
            image: row[5] || undefined,
          });
        }
      }

      // Push the last day if it exists
      if (currentDay) {
        dailyItinerary.push(currentDay);
      }

      // Add the daily itinerary to the result
      result.dailyItinerary = dailyItinerary;
      
      return result;
    } catch (error) {
      console.error('Error fetching or parsing CSV:', error);
      return null;
    }
  };

export const saveCsvData = async (quoteId: string, data: CsvItineraryData): Promise<boolean> => {
  try {
    // Convert the data back to CSV format
    const csvData = [
      [
        'quoteId', 'name', 'days', 'nights', 'startDate', 'costINR', 'costUSD', 'guests', 'adults', 'kids'
      ],
      [
        data.quoteId,
        data.name,
        data.days,
        data.nights,
        data.startDate,
        data.costINR,
        data.costUSD,
        data.guests,
        data.adults,
        data.kids
      ],
      [] // Empty line before activities
    ];

    // Add activities
    for (const day of data.dailyItinerary) {
      // Add day header
      csvData.push([
        'Day',
        day.day.toString(),
        day.date,
        day.title,
        '', // Empty description for header
        ''  // Empty image for header
      ]);

      // Add activities for the day
      for (const activity of day.activities) {
        csvData.push([
          day.day.toString(),
          activity.time,
          activity.title,
          activity.type,
          activity.description,
          activity.image || ''
        ]);
      }
    }

    // Convert to CSV string
    const csvString = Papa.unparse(csvData, {
      quotes: true,
      header: false,
    });

    // In a real app, you would send this to your API to save the file
    // For now, we'll just log it
    console.log('CSV to be saved:', csvString);
    
    // In a real implementation, you would do something like:
    // const response = await fetch('/api/save-itinerary', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ quoteId, csvData: csvString }),
    // });
    // return response.ok;
    
    return true; // Simulate success
  } catch (error) {
    console.error('Error saving CSV data:', error);
    return false;
  }
};
