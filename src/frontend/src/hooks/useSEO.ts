import { useEffect } from 'react';

interface SEOProps {
  title: string;
  description?: string;
}

export function useSEO({ title, description }: SEOProps) {
  useEffect(() => {
    const baseTitle = "JDIH UNTAG Banyuwangi";
    const previousTitle = document.title;
    
    // Update Title
    document.title = title ? `${title} - ${baseTitle}` : baseTitle;

    // Update Meta Description
    let metaDescription = document.querySelector('meta[name="description"]');
    let previousDescription = "";
    
    if (metaDescription) {
      previousDescription = metaDescription.getAttribute('content') || "";
    } else {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }

    if (description) {
      // Menghapus tag HTML jika ada di dalam description (terutama dari Quill editor)
      const cleanDescription = description.replace(/<[^>]*>?/gm, '').substring(0, 160);
      metaDescription.setAttribute('content', cleanDescription);
    }

    // Cleanup when component unmounts
    return () => {
      document.title = previousTitle;
      if (metaDescription && previousDescription) {
        metaDescription.setAttribute('content', previousDescription);
      }
    };
  }, [title, description]);
}
