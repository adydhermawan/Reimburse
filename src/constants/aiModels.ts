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
        description: 'Paling Akurat. Terbaik untuk struk yang tulisannya agak pudar atau miring.',
        limit: '~20 RPD',
    },
    {
        id: 'gemini-2.5-flash',
        name: 'Gemini 2.5 Flash',
        description: 'Generasi sebelumnya, tetap stabil untuk OCR.',
        limit: '~20 RPD',
    },
    {
        id: 'gemini-2.5-flash-lite',
        name: 'Gemini 2.5 Flash Lite',
        description: 'Sangat cepat, cocok untuk validasi struk secara instan.',
        limit: '~20 RPD',
    },
    {
        id: 'gemma-3-27b-it',
        name: 'Gemma 3 27B',
        description: 'Best for Dev. Limit sangat besar, akurasi sangat tinggi untuk teks jelas.',
        limit: '~14.4 RPD',
    },
    {
        id: 'gemma-3-12b-it',
        name: 'Gemma 3 12B',
        description: 'Lebih cepat dari 27B, cocok untuk ekstraksi JSON sederhana.',
        limit: '~14.4 RPD',
    },
    {
        id: 'gemma-3-4b-it',
        name: 'Gemma 3 4B / 2B',
        description: 'Sangat ringan, tapi mungkin agak kesulitan dengan teks yang sangat kecil.',
        limit: '~14.4 RPD',
    }
];
