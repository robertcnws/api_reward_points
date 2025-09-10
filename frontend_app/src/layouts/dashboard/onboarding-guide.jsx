import { Box, Typography } from '@mui/material';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Joyride, { STATUS, ACTIONS } from 'react-joyride';

import { useDataContext } from 'src/auth/context/data/data-context';
import { Iconify } from 'src/components/iconify';

const OnboardingGuide = ({ run, setRun, ready, onFinish, stepFilters = null, disableBeacon = false }) => {

    const {
        loadedAllRewardJoyRides: joyRides,
        refetchAllRewardJoyRides: refetchJoyRides,
    } = useDataContext();

    // const [run, setRun] = useState(false);
    const [steps, setSteps] = useState([]);

    const [isEnglish, setIsEnglish] = useState(true);

    const translate = useCallback(() => setIsEnglish(prev => !prev), []);

    const localeEN = useMemo(() => ({
        back: 'Back',
        close: 'Close',
        last: 'Finish',
        next: 'Next',
        open: 'Open',
        skip: 'Skip',
        step: 'Step',
        of: 'of',
    }), []);
    const localeES = useMemo(() => ({
        back: 'Atrás',
        close: 'Cerrar',
        last: 'Finalizar',
        next: 'Siguiente',
        open: 'Abrir',
        skip: 'Saltar',
        step: 'Paso',
        of: 'de',
    }), []);

    useEffect(() => {
        if (joyRides && joyRides.length > 0) {
            const finalJoyRides = stepFilters ? joyRides.filter(stepFilters) : joyRides;
            setSteps(finalJoyRides.map(({ componentId, title, description, placement, relatedImageName, translation }, index) => {
                const tTitle = isEnglish ? title : (translation?.es?.title || title);
                const tDesc = isEnglish ? description : (translation?.es?.content || description);

                return ({
                    target: `#${componentId}`,
                    content: (
                        <>
                            {relatedImageName &&
                                <img
                                    src={`/logo/design/${relatedImageName}.png`}
                                    alt={title}
                                    style={{ width: '100%', maxHeight: 120, objectFit: 'contain', marginBottom: 10 }}
                                />
                            }
                            <h3>{tTitle}</h3>
                            <p style={{ fontSize: 14 }}>{tDesc}</p>
                            <Box
                                sx={{
                                    display: 'flex',
                                    flexDirection: 'row',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    color: '#00A78E',
                                }}
                                onClick={translate}
                            >
                                <Iconify icon="ri:translate" />
                                <Typography sx={{ fontSize: 12 }}>
                                    Translate to {isEnglish ? 'Spanish' : 'English'}
                                </Typography>
                            </Box>
                        </>
                    ),
                    placement: placement || 'bottom',
                    disableBeacon: disableBeacon || index !== 0,
                })
            }));
        }
    }, [joyRides, stepFilters, disableBeacon, translate, isEnglish]);

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
            locale={isEnglish ? localeEN : localeES}
            styles={{
                options: {
                    zIndex: 10000,
                    primaryColor: '#00A78E',
                },
                tooltip: {
                    borderRadius: 20,
                },
                tooltipContainer: {
                    borderRadius: 20,
                },
                spotlight: {
                    borderRadius: 12,
                },
            }}
        />
    );
};


export default OnboardingGuide;
