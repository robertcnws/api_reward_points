import { ExpandMoreOutlined } from "@mui/icons-material";
import { Accordion, AccordionDetails, AccordionSummary, Typography } from "@mui/material";

export function FAQView({ faq, keyIndex }) {
    return (
        <Accordion sx={{ mb: 0 }}>
            <AccordionSummary expandIcon={<ExpandMoreOutlined />}>
                <Typography sx={{ fontWeight: 'bold' }}>{faq.questionEn}</Typography>
            </AccordionSummary>
            <AccordionDetails>
                <Typography variant="body2" sx={{ mb: 1, mt: -3 }}>
                    {faq.answerEn}
                </Typography>
                <Typography sx={{ fontWeight: 'bold' }}>
                    {faq.questionEsp}
                </Typography>
                <Typography variant="body2">
                    {faq.answerEsp}
                </Typography>
            </AccordionDetails>
        </Accordion>
    )
}