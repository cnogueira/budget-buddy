import * as Icons from 'lucide-react';
import { type ComponentType } from 'react';
import { LucideProps } from 'lucide-react';

interface CategoryIconProps extends LucideProps {
    name: string;
    color?: string;
}

function toPascalCase(name: string): string {
    return name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
}

export function CategoryIcon({ name, color, ...props }: CategoryIconProps) {
    const pascalName = toPascalCase(name);
    const IconComponent = (Icons as unknown as Record<string, ComponentType<LucideProps>>)[pascalName] || Icons.HelpCircle;
    return <IconComponent color={color} {...props} />;
}
