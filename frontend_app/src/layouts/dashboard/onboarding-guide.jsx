import React, { useState, useEffect } from 'react';
import Joyride, { STATUS, ACTIONS } from 'react-joyride';

import { useDataContext } from 'src/auth/context/data/data-context';

const OnboardingGuide = ({ run, setRun, ready, onFinish, stepFilters = null, disableBeacon = false }) => {

    const {
        loadedAllRewardJoyRides: joyRides,
        refetchAllRewardJoyRides: refetchJoyRides,
    } = useDataContext();

    // const [run, setRun] = useState(false);
    const [steps, setSteps] = useState([]);

    useEffect(() => {
        if (joyRides && joyRides.length > 0) {
            const finalJoyRides = stepFilters ? joyRides.filter(stepFilters) : joyRides;
            setSteps(finalJoyRides.map(({ componentId, title, description, placement }, index) => ({
                target: `#${componentId}`,
                content: (
                    <>
                        <h3>{title}</h3>
                        <p>{description}</p>
                    </>
                ),
                placement: placement || 'bottom',
                disableBeacon: disableBeacon || index !== 0,
            })));
        }
    }, [joyRides, stepFilters, disableBeacon]);

    useEffect(() => {
        let intervalId;

        if (ready) {
            intervalId = setInterval(() => {
                const el = document.querySelector(steps[0]?.target);
                if (el) {
                    setRun(true);
                    clearInterval(intervalId);
                }
            }, 100);
        }
        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [ready, steps, setRun]);

    const handleJoyrideCallback = (data) => {
        const { status, action } = data;
        if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status) || action === ACTIONS.CLOSE) {
            setRun(false);
            if (onFinish) onFinish();
        }
    };

    return (
        <Joyride
            steps={steps}
            run={run}
            continuous
            showSkipButton
            showProgress
            callback={handleJoyrideCallback}
            styles={{ options: { zIndex: 10000, primaryColor: '#00A78E' } }}
        />
    );
};


export default OnboardingGuide;
