import { Backgrounds } from '../../components/database-parse-type'
import { useState } from 'react'

export default function BackgroundSelection({ ownedBackgrounds, equippedBackground, allBackgrounds, onChange }: { ownedBackgrounds: string[], equippedBackground: string, allBackgrounds: Backgrounds, onChange: (background: string) => void }) {
    
    const [selectedBackground, setSelectedBackground] = useState(equippedBackground);

    const UpdateBackground = (e: string) => {
        // Get the selected background ID from the event
        const selectedBackgroundID = e;
        
        // Find the selected background object from the ownedBackgrounds array
        const selectedBackground = ownedBackgrounds.find((background) => background === selectedBackgroundID);
    
        if (selectedBackground) {
            // For example, set the equippedBackground to the selected background
            setSelectedBackground(selectedBackground);
            
            // Call the onChange function with the selected background
            onChange(selectedBackground);
        }
    }

    const selectedBackgroundData = allBackgrounds.selectedBackground;
    
    return (
        <div className='grid place-items-center font-main'>

            <img src={allBackgrounds[selectedBackground].image} alt={selectedBackground} width={300} height={0} className='mt-2 mx-5'/>

            <h1 className='text-black text-lg'>Currently Selected: {selectedBackground}</h1>
            <div className='flex overflow-x-auto max-w-[600px] mt-3 bg-[#939393] border-2 border-slate-600'>
                {ownedBackgrounds.map((background) => (
                    <img key={background} className={'hover:cursor-pointer mx-2 my-3'} onClick={() => UpdateBackground(background)} src={allBackgrounds[background].image} alt={background} width={100} height={0}/>
                ))}
            </div>
        </div>
    );
}