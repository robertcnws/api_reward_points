import { Box, Typography, Popover, ClickAwayListener } from "@mui/material";
import { useMemo, useState } from "react";

export function DealerportalQuoteInfoProductsTableProductCell({
  product,
  isOrdered,
}) {
  const inStock = useMemo(
    () => (product?.product?.actualAvailableStock ?? 0) > 0,
    [product?.product?.actualAvailableStock]
  );

  const [anchorPos, setAnchorPos] = useState(null); // { top, left }
  const open = Boolean(anchorPos);

  const handleOpen = (e) => {
    e.stopPropagation();

    // posición del click (viewport)
    const { clientX, clientY } = e;

    // “pegado” a la derecha del click
    setAnchorPos({
      top: clientY - 10,
      left: clientX + 50,
    });
  };

  const handleClose = () => setAnchorPos(null);

  return (
    <>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
        <Typography variant="body2">{product?.product?.name || "N/A"}</Typography>

        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          {!isOrdered && (
            <Typography
              variant="caption"
              color={inStock ? "success.main" : "error.main"}
              sx={{ fontWeight: 700 }}
            >
              {inStock ? "In Stock" : "Out of Stock"}
            </Typography>
          )}

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              cursor: "pointer",
              width: "fit-content",
              fontStyle: 'italic',
            }}
            onClick={handleOpen}
          >
            Click for more details...
          </Typography>
        </Box>
      </Box>

      <Popover
        open={open}
        onClose={handleClose}
        anchorReference="anchorPosition"
        anchorPosition={anchorPos || { top: 0, left: 0 }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{
          paper: {
            sx: {
              p: 2,
              maxWidth: 320,
              overflow: "visible",
              position: "relative",
              bgcolor: "warning.lighter",
              // flecha SIEMPRE en el borde izquierdo
              "&:before": {
                content: '""',
                position: "absolute",
                width: 10,
                height: 10,
                left: -5,
                top: 14,
                bgcolor: "warning.lighter",
                transform: "rotate(45deg)",
              },
            },
          },
        }}
      >
        <ClickAwayListener onClickAway={handleClose}>
          <Box onClick={(e) => e.stopPropagation()}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Description
            </Typography>
            <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
              {product?.product?.description || "No description available."}
            </Typography>
          </Box>
        </ClickAwayListener>
      </Popover>
    </>
  );
}
