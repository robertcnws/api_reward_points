import { Box, Card, Typography } from "@mui/material";
import { useCallback } from "react";
import { Label } from "src/components/label";
import { fCurrency } from "src/utils/format-number";
import { fDateTime } from "src/utils/format-time";

export function DealerportalQuoteInfoCard({
  quote,
  currentColor,
  isMobile,
}) {
  const getFullName = useCallback(
    (user) =>
      `${user?.firstName || user?.first_name || ""} ${user?.lastName || user?.last_name || ""}`.trim(),
    []
  );

  return (
    <Card sx={{ p: 1 }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          width: "100%",
          gap: 2,                 // ✅ separa las columnas
          textAlign: "left",      // ✅ fuerza texto a la izquierda
          minHeight: isMobile ? 'auto' : 200,          // ✅ altura mínima para evitar colapsar en móviles
        }}
      >
        {/* LEFT */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: 1,
            width: isMobile ? "100%" : "auto",
          }}
        >
          <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 1 }}>
            <Typography variant="body2">Status:</Typography>
            <Label color={currentColor}>{quote?.status?.toUpperCase()}</Label>
          </Box>

          <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 1 }}>
            <Typography variant="body2"><b>Job Name:</b></Typography>
            <Typography variant="body1">{quote?.name || "N/A"}</Typography>
          </Box>

          <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 1 }}>
            <Typography variant="body2"><b>Created By:</b></Typography>
            <Typography variant="body1">{getFullName(quote?.createdBy) || "N/A"}</Typography>
          </Box>

          <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 1 }}>
            <Typography variant="body2"><b>Created At:</b></Typography>
            <Typography variant="body1">{fDateTime(quote?.createdAt) || "N/A"}</Typography>
          </Box>

          <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 1 }}>
            <Typography variant="body2"><b>Mark Up:</b></Typography>
            <Typography variant="body1">{quote?.markup || "N/A"}</Typography>
          </Box>
        </Box>

        {/* RIGHT */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",          // ✅ en mobile: izquierda
            width: isMobile ? "100%" : "auto", // ✅ ocupa todo en mobile
            gap: 1,
          }}
        >
          <Typography variant="h6">QUOTE TOTALS</Typography>

          <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 1 }}>
            <Typography variant="body2"><b>Total Cost:</b></Typography>
            <Typography variant="body1">{fCurrency(quote?.totalCost || 0) || "N/A"}</Typography>
          </Box>

          <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 1 }}>
            <Typography variant="body2"><b>Mark Up Total:</b></Typography>
            <Typography variant="body1">{fCurrency(quote?.markupTotal || 0) || "N/A"}</Typography>
          </Box>

          <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 1 }}>
            <Typography variant="body2"><b>Total Sell:</b></Typography>
            <Typography variant="body1">{fCurrency(quote?.totalSell || 0) || "N/A"}</Typography>
          </Box>
        </Box>
      </Box>
    </Card>
  );
}
