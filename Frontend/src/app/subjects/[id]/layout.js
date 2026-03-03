'use client';

import { useParams } from 'next/navigation';
import { SubjectProvider } from '@/context/SubjectContext';

export default function SubjectLayout({ children }) {
    const params = useParams();
    const subjectId = params?.id;

    if (!subjectId) return children;

    return (
        <SubjectProvider subjectId={subjectId}>
            {children}
        </SubjectProvider>
    );
}
