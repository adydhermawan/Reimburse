export interface AIModelOption {
    id: string;
    name: string;
    description: string;
    limit: string;
}

export const AI_MODELS: AIModelOption[] = [
    {
        id: 'gemini-3.5-flash',
        name: 'Gemini 3.5 Flash',
        description: 'Terbaru & Paling Akurat. Terbaik untuk segala jenis struk belanja.',
        limit: '~20 RPD',
    },
    {
        id: 'gemini-3.1-flash-lite',
        name: 'Gemini 3.1 Flash Lite',
        description: 'Sangat cepat dan efisien untuk ekstraksi data terstruktur.',
        limit: '~20 RPD',
    },
    {
        id: 'gemini-2.5-pro',
        name: 'Gemini 2.5 Pro',
        description: 'Sangat cerdas, terbaik untuk struk yang kompleks atau panjang.',
        limit: '~20 RPD',
    },
    {
        id: 'gemini-2.5-flash',
        name: 'Gemini 2.5 Flash',
        description: 'Generasi sebelumnya, stabil dan akurat untuk OCR.',
        limit: '~20 RPD',
    },
    {
        id: 'gemini-2.5-flash-lite',
        name: 'Gemini 2.5 Flash Lite',
        description: 'Versi ringan dari 2.5, pemrosesan cepat.',
        limit: '~20 RPD',
    },
    {
        id: 'gemini-2.0-flash',
        name: 'Gemini 2.0 Flash',
        description: 'Model ultra-cepat, handal untuk deteksi teks instan.',
        limit: '~20 RPD',
    }
];
