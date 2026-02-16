import { Helmet } from 'react-helmet-async';

export default function SEO({ title, description, keywords, image, url }) {
    const siteTitle = 'FlowState';
    const fullTitle = title ? `${title} | ${siteTitle}` : siteTitle;
    const siteUrl = 'https://flow-state-liart.vercel.app'; // Replace with actual production URL
    const defaultImage = '/og-image.png'; // Make sure this exists or use a remote URL

    return (
        <Helmet>
            {/* Standard Metadata */}
            <title>{fullTitle}</title>
            <meta name="description" content={description || 'FlowState — A psychologically optimized task manager for students, developers & founders.'} />
            <meta name="keywords" content={keywords || 'productivity, task manager, focus mode, habits, flow state, pomodoro'} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content="website" />
            <meta property="og:url" content={url || siteUrl} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description || 'FlowState — Execute with Consistency. The all-in-one productivity platform.'} />
            <meta property="og:image" content={image || defaultImage} />

            {/* Twitter */}
            <meta property="twitter:card" content="summary_large_image" />
            <meta property="twitter:url" content={url || siteUrl} />
            <meta property="twitter:title" content={fullTitle} />
            <meta property="twitter:description" content={description || 'FlowState — Execute with Consistency.'} />
            <meta property="twitter:image" content={image || defaultImage} />
        </Helmet>
    );
}
