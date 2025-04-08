import { useCallback, useEffect, useMemo, useState } from "react";

export type Position = {
  x: number;
  y: number;
  top: number;
  left: number;
  bottom: number;
  right: number;
};

const debounceFrame = (updatePosition: () => void) => {
  let pendingPromise: Promise<void> | null = null;
  let frameRequested = false;

  return () => {
    if (pendingPromise) return pendingPromise;

    if (!frameRequested) {
      frameRequested = true;

      pendingPromise = new Promise((resolve) => {
        requestAnimationFrame(() => {
          frameRequested = false;
          pendingPromise = null;
          resolve(updatePosition());
        });
      });
    }

    return pendingPromise;
  };
};

const usePosition = (referenceElement: Element) => {
  const [position, setPosition] = useState<Position>({
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  });

  const updatePosition = useCallback(() => {
    if (!referenceElement) return;

    const rect = referenceElement.getBoundingClientRect();

    setPosition((oldRect) => {
      const newRect = {
        x: rect.x,
        y: rect.y,
        top: rect.top,
        left: rect.left,
        bottom: rect.bottom,
        right: rect.right,
      };

      const hasChanged = Object.entries(newRect).some(
        ([key, value]) => oldRect[key as keyof Position] !== value
      );

      return hasChanged ? newRect : oldRect;
    });
  }, [referenceElement]);

  const debouncedUpdate = useMemo(
    () => debounceFrame(updatePosition),
    [updatePosition]
  );

  useEffect(() => {
    if (!referenceElement) return;

    debouncedUpdate();

    window.addEventListener("resize", debouncedUpdate);
    window.addEventListener("scroll", debouncedUpdate, { passive: true });

    return () => {
      window.removeEventListener("resize", debouncedUpdate);
      window.removeEventListener("scroll", debouncedUpdate);
    };
  }, [debouncedUpdate, referenceElement, updatePosition]);

  return position;
};

export default usePosition;
