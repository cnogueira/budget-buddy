import * as Icons from 'lucide-react';
import { LucideProps } from 'lucide-react';

interface CategoryIconProps extends LucideProps {
    name: string;
    color?: string;
}

export function CategoryIcon({ name, color, ...props }: CategoryIconProps) {
    // Map string to Lucide component
    // Use a fallback if the icon name is not found
    const IconComponent = (Icons as any)[name] || Icons.HelpCircle;

    return <IconComponent color={color} {...props} />;
}
