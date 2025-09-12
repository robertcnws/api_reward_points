import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';

import { endpoints, axiosInstanceBackend } from 'src/utils/axios';

import { Image } from 'src/components/image';
import { Lightbox, useLightBox } from 'src/components/lightbox';
import {
  Carousel,
  useCarousel,
} from 'src/components/carousel';

// ----------------------------------------------------------------------

export function StoreProductFolderItemCarousel({
  images,
  maxHeight = 100,
  maxWidth = 100,
  overflow = 'inherit',
}) {
  const carousel = useCarousel({
    thumbs: {
      slidesToShow: 'auto',
    },
  });

  const [initialFiles, setInitialFiles] = useState([]);

  useEffect(() => {
    let alive = true;

    const toFileUrl = async (att) => {
      try {
        if (att instanceof File) {
          return { fileUrl: URL.createObjectURL(att), name: att.name, isNew: true };
        }
        if (typeof att === 'string') {
          return { fileUrl: att, name: 'image' };
        }
        if (att?.fileUrl) return att;
        if (att?.url) return { ...att, fileUrl: att.url };
        if (att?.src) return { ...att, fileUrl: att.src };
        
        if (att?.file) {
          const { data } = await axiosInstanceBackend.get(
            endpoints.rewardPoints.getFileUrl(att.file)
          );
          return { ...att, fileUrl: data?.url || '' };
        }
        
        return att;
      } catch (e) {
        console.error('Error al obtener URL de imagen:', e);
        return att;
      }
    };

    (async () => {
      const base = Array.isArray(images) ? images : [];
      const loaded = await Promise.all(base.map(toFileUrl));
      let valid = loaded.filter((x) => !!x?.fileUrl);
      
      if (valid.length === 0) {
        try {
          const fallbackKey = 'store_products/nws_reward_points_preview.png';
          const { data } = await axiosInstanceBackend.get(
            endpoints.rewardPoints.getFileUrl(fallbackKey)
          );
          valid = [{ fileUrl: data?.url, name: 'Default Image', isNew: false }];
        } catch {
          valid = [{ fileUrl: '/assets/nws_reward_points_preview.png', name: 'Default Image' }];
        }
      }

      if (alive) setInitialFiles(valid);
    })();

    return () => { alive = false; };
  }, [images]);
  
  const slides = (initialFiles ?? [])
    .map((img) => ({ src: img.fileUrl }))
    .filter((s) => !!s.src);

  const lightbox = useLightBox(slides);

  useEffect(() => {
    if (lightbox.open) {
      carousel.mainApi?.scrollTo(lightbox.selected, true);
    }
  }, [carousel.mainApi, lightbox.open, lightbox.selected]);

  return (
    <>
      <div style={{
        maxWidth,
        maxHeight,
        overflow,
        // overflow: 'hidden'
      }}>
        <Box sx={{ mb: 2.5, position: 'relative', display: 'flex', justifyContent: 'center' }}>
          {/* <CarouselArrowNumberButtons
            {...carousel.arrows}
            options={carousel.options}
            totalSlides={carousel.dots.dotCount}
            selectedIndex={carousel.dots.selectedIndex + 1}
            sx={{ right: 16, bottom: 16, position: 'absolute' }}
          /> */}

          <Carousel carousel={carousel} sx={{ borderRadius: 2 }}>
            {slides.slice(0, 1).map((slide) => (
              <Image
                key={slide.src}
                alt={slide.src}
                src={slide.src}
                ratio="1/1"
                onClick={() => lightbox.onOpen(slide.src)}
                sx={{
                  cursor: 'zoom-in',
                  minWidth: maxWidth,
                  maxWidth,
                  // maxHeight: 700, 
                  justifyContent: 'flex-end',
                  display: 'flex',
                  alignItems: 'center',
                  objectFit: 'contain'
                }}
              />
            ))}
          </Carousel>
        </Box>

        {/* <CarouselThumbs
          ref={carousel.thumbs.thumbsRef}
          options={carousel.options?.thumbs}
          slotProps={{ disableMask: true }}
          sx={{ width: 320 }}
        >
          {slides.map((item, index) => (
            <CarouselThumb
              key={item.src}
              index={index}
              src={item.src}
              selected={index === carousel.thumbs.selectedIndex}
              onClick={() => carousel.thumbs.onClickThumb(index)}
            />
          ))}
        </CarouselThumbs> */}
      </div>

      <Lightbox
        index={lightbox.selected}
        slides={slides}
        open={lightbox.open}
        close={lightbox.onClose}
        onGetCurrentIndex={(index) => lightbox.setSelected(index)}
      />
    </>
  );
}
