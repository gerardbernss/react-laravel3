import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { type ComponentProps } from 'react';

type AppButtonProps = ComponentProps<typeof Button>;

/** Thin wrapper around the ui/Button with named sub-components (Primary, Secondary, Danger, Ghost) for semantic intent at call sites. */
export function AppButton({ className, ...props }: AppButtonProps) {
    return <Button className={cn(className)} {...props} />;
}

AppButton.Primary = function AppButtonPrimary({ className, ...props }: AppButtonProps) {
    return <Button variant="default" className={cn(className)} {...props} />;
};

AppButton.Secondary = function AppButtonSecondary({ className, ...props }: AppButtonProps) {
    return <Button variant="outline" className={cn(className)} {...props} />;
};

AppButton.Danger = function AppButtonDanger({ className, ...props }: AppButtonProps) {
    return <Button variant="destructive" className={cn(className)} {...props} />;
};

AppButton.Ghost = function AppButtonGhost({ className, ...props }: AppButtonProps) {
    return <Button variant="ghost" className={cn(className)} {...props} />;
};
