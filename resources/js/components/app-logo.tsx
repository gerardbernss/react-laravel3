export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
                {/* Replace SVG with PNG from public/images */}
                <img src="/images/slu-logo2.png" alt="SLU Logo" className="size-5 object-contain" />
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate leading-tight font-semibold">Saint Louis University</span>
            </div>
        </>
    );
}
