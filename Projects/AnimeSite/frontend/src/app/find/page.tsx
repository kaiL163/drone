import { redirect } from 'next/navigation';
import { searchAnime } from '@/lib/api';

interface FindPageProps {
    searchParams: Promise<{ title?: string }>;
}

// Server component: search Shikimori by title → redirect to /title/:id
export default async function FindPage({ searchParams }: FindPageProps) {
    const { title } = await searchParams;
    if (!title) redirect('/');

    const results = await searchAnime(title, 5);
    if (results.length > 0) {
        redirect(`/title/${results[0].id}`);
    }

    // Fallback to search page
    redirect(`/search?q=${encodeURIComponent(title)}`);
}
