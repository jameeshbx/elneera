import Image from "next/image";

interface CardProps {
    title: string;
    backgroundImage: string;
    isGradient?: boolean;
    isLarge?: boolean;
    className?: string;
    marginClass?: string;
}

export const Card = ({ title, backgroundImage, isGradient, isLarge, className, marginClass }: CardProps) => {
    return (
        <div className={`
            rounded-3xl overflow-hidden relative 
            w-full sm:w-3/4 md:w-2/3 
            ${isLarge ? 'lg:w-w1' : 'lg:w-64'} 
            mx-auto ${marginClass} ${className}
        `}>
            <div className={`absolute inset-0 ${backgroundImage.includes('feature3') ? 'lg:-mt-4 sm:-mt-8' : ''}`}>
                <Image
                    src={backgroundImage}
                    alt="Background"
                    fill
                    className="object-cover"
                />
            </div>
            {isGradient && <div className="absolute inset-0" />}
            <div className={`
                p-6 md:p-8 flex flex-col h-36 relative z-10
                ${isGradient ? 'justify-center items-center text-center' : 'justify-between'}
            `}>
                <div>
                    <h3 className={`
                        font-medium mb-2
                        ${isGradient ? 'font-nunito text-xl sm:text-2xl md:text-3xl text-center leading-8 sm:leading-9 md:leading-10' : 'font-poppins text-lg sm:text-xl md:text-xl'}
                        ${isGradient || backgroundImage.includes('feature') ? 'text-white' : ''}
                    `}>
                        {title}
                    </h3>
                </div>
            </div>
        </div>
    );
} 