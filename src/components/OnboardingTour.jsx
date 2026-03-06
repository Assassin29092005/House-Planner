import React, { useState } from 'react';

const STEPS = [
    {
        title: 'Welcome to House Planner! 🏗️',
        content: 'This tool lets you design floor plans in 2D and see them instantly in 3D. Let\'s take a quick tour!',
        target: null,
        position: 'center',
    },
    {
        title: 'Asset Library',
        content: 'Drag furniture, pillars, stairs, and room labels from here onto the canvas. Try dragging a bed!',
        target: 'sidebar',
        position: 'right',
    },
    {
        title: 'Drawing Tools',
        content: 'Use SELECT (V) to move things, WALL (W) to draw walls, and PAINT (P) to color walls. Try pressing W and drawing!',
        target: 'toolbar',
        position: 'bottom',
    },
    {
        title: 'Floor Manager',
        content: 'Add multiple floors with the + button. Switch between floors using the dropdown. Each floor stacks in 3D!',
        target: 'floor-selector',
        position: 'bottom',
    },
    {
        title: '3D Preview',
        content: 'Your building renders live in 3D. Toggle roof, switch day/night, or even walk through in first-person mode!',
        target: '3d-viewer',
        position: 'left',
    },
    {
        title: 'Save & Export',
        content: 'Save as JSON (💾), export as PNG (📸), or export as PDF. Use Ctrl+S to quick save. You\'re all set!',
        target: 'save-buttons',
        position: 'bottom',
    },
];

const OnboardingTour = ({ onComplete }) => {
    const [step, setStep] = useState(0);
    const [visible, setVisible] = useState(true);

    if (!visible) return null;

    const currentStep = STEPS[step];
    const isLast = step === STEPS.length - 1;

    const handleNext = () => {
        if (isLast) {
            setVisible(false);
            localStorage.setItem('house-planner-toured', 'true');
            if (onComplete) onComplete();
        } else {
            setStep(step + 1);
        }
    };

    const handleSkip = () => {
        setVisible(false);
        localStorage.setItem('house-planner-toured', 'true');
        if (onComplete) onComplete();
    };

    return (
        <div className="fixed inset-0 z-[300] pointer-events-none">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 pointer-events-auto" onClick={handleSkip} />

            {/* Toast */}
            <div className={`absolute pointer-events-auto animate-slide-up ${currentStep.position === 'center' ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2' : 'bottom-24 left-1/2 -translate-x-1/2'
                }`}>
                <div className="bg-[#1e293b] border border-[#334155] rounded-2xl shadow-2xl p-6 w-96 max-w-[90vw]">
                    {/* Progress */}
                    <div className="flex gap-1 mb-4">
                        {STEPS.map((_, i) => (
                            <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= step ? 'bg-blue-500' : 'bg-[#334155]'}`} />
                        ))}
                    </div>

                    <h3 className="text-lg font-black text-white mb-2">{currentStep.title}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed mb-5">{currentStep.content}</p>

                    <div className="flex justify-between items-center">
                        <button onClick={handleSkip} className="text-xs text-slate-500 hover:text-slate-300 font-bold transition-colors">
                            Skip Tour
                        </button>
                        <div className="flex gap-2">
                            {step > 0 && (
                                <button onClick={() => setStep(step - 1)} className="px-4 py-2 bg-[#0f172a] border border-[#334155] text-slate-400 hover:text-white rounded-lg text-xs font-bold transition-colors">
                                    Back
                                </button>
                            )}
                            <button onClick={handleNext} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-black transition-colors">
                                {isLast ? 'Start Building!' : 'Next →'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OnboardingTour;
