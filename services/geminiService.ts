import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ElectionData, TARGET_PARTIES } from "../types";

// Helper: Resize and compress image before sending to API
// This drastically reduces payload size and upload time.
const compressAndConvertToBase64 = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        // Max dimension 1024px is sufficient for OCR, vastly smaller than camera 4000px+
        const MAX_WIDTH = 1024;
        const scaleSize = MAX_WIDTH / img.width;
        
        // Only resize if image is larger than limit
        if (scaleSize < 1) {
            canvas.width = MAX_WIDTH;
            canvas.height = img.height * scaleSize;
        } else {
            canvas.width = img.width;
            canvas.height = img.height;
        }

        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Compress to JPEG at 0.7 quality
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        // Remove prefix to get raw base64
        resolve(dataUrl.split(',')[1]);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    lga: { type: Type.STRING, description: "Local Government Area name" },
    registrationArea: { type: Type.STRING, description: "Registration Area / Ward name" },
    pollingUnit: { type: Type.STRING, description: "Polling Unit name" },
    delimitation: { type: Type.STRING, description: "The delimitation code (e.g., 04/04/06/013)" },
    votersOnRegister: { type: Type.INTEGER, description: "Number of Voters on the Register" },
    accreditedVoters: { type: Type.INTEGER, description: "Number of Accredited Voters" },
    ballotPapersIssued: { type: Type.INTEGER, description: "Number of Ballot Papers Issued to the Polling Unit" },
    unusedBallotPapers: { type: Type.INTEGER, description: "Number of Unused Ballot Papers" },
    spoiledBallotPapers: { type: Type.INTEGER, description: "Number of Spoiled Ballot Papers" },
    rejectedBallots: { type: Type.INTEGER, description: "Number of Rejected Ballots" },
    totalValidVotes: { type: Type.INTEGER, description: "Number of Total Valid Votes (Total valid votes cast for all parties)" },
    totalUsedBallotPapers: { type: Type.INTEGER, description: "Total Number of Used Ballot Papers (Total of #5 + #6 + #7)" },
    votes: {
      type: Type.OBJECT,
      description: "Votes scored by each political party",
      properties: TARGET_PARTIES.reduce((acc, party) => {
        acc[party] = { type: Type.INTEGER, description: `Votes for ${party}` };
        return acc;
      }, {} as Record<string, Schema>)
    }
  },
  required: [
    "lga", "registrationArea", "pollingUnit", "delimitation",
    "votersOnRegister", "accreditedVoters", "ballotPapersIssued",
    "unusedBallotPapers", "spoiledBallotPapers", "rejectedBallots",
    "totalValidVotes", "totalUsedBallotPapers", "votes"
  ]
};

export const extractDataFromImage = async (file: File): Promise<ElectionData> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing in environment variables.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  // Use the compressed image data
  const base64Data = await compressAndConvertToBase64(file);

  const prompt = `
    Analyze this image of an INEC EC 8A Statement of Poll Result form.
    Extract the administrative details and the voting figures strictly.
    
    1. Look for the "State", "Local Government Area", "Registration Area", and "Polling Unit" fields at the top.
    2. Extract the "Code" boxes to form the Delimitation string (e.g., State Code / LGA Code / Ward Code / PU Code).
    3. Extract the numerical statistics from the top right table (Items #1 to #8).
    4. Extract the scores for the following parties: ${TARGET_PARTIES.join(', ')}.
    
    Rules:
    - If a field is written as "Nil", "-", "Zero", or left blank, treat it as the number 0.
    - Be careful with handwritten numbers. 
    - Verify that the total valid votes match the sum of individual party votes if possible, but prioritize what is written.
    - Return purely the JSON object matching the schema.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: base64Data } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.1,
      }
    });

    const text = response.text;
    if (!text) throw new Error("No data returned from AI");
    
    return JSON.parse(text) as ElectionData;
  } catch (error) {
    console.error("Extraction error:", error);
    throw error;
  }
};