import Image from "next/image";

interface FeatureCardProps {
    title: string;
    description?: string;
    imageSrc: string;
    isGradient?: boolean;
    imageClassName?: string;
    containerClassName?: string;
}

export function FeatureCard({
    title,
    description,
    imageSrc,
    isGradient = false,
    imageClassName = "",
    containerClassName = "",
}: FeatureCardProps) {
    return (
        <div className={`rounded-3xl overflow-hidden relative w-full ${containerClassName}`}>
            <div className={`absolute inset-0  ${imageClassName}`}>
                <Image
                    src={imageSrc}
                    alt="Background"
                    fill
                    className={`object-cover`}
                />
            </div>
            <div className="absolute inset-0"></div>
            <div className="p-4 xl:p-6 lg:p-8 flex flex-col h-36 relative z-10">
                {isGradient ? (
                    <h3 className="text-xl sm:text-2xl xl:text-3xl font-medium text-white font-nunito leading-8 sm:leading-9 xl:leading-10 text-center align-middle">
                        {title}
                    </h3>
                ) : (
                    <div>
                        <h3 className={`font-poppins font-medium text-lg sm:text-xl xl:text-xl align-middle mb-2 ${isGradient ? 'text-white' : ''}`}>
                            {description || title}
                        </h3>
                    </div>
                )}
            </div>
        </div>
    );
} 