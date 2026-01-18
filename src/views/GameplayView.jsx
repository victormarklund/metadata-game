import {
  Card,
  Flex,
  Text,
  Button,
  Heading,
  Select,
  Spinner,
} from "@radix-ui/themes";
import { useContext, useEffect, useMemo } from "react";
import { AppContext } from "src/contexts/AppContext";
import { MONTH_ARRAY } from "src/data/constants";
import { buildPublicUrl } from "src/utils/publicUrl";

export default function GameplayView() {
  const {
    gameData,
    answer,

    currentImage,
    loadingImg,
    setLoadingImg,

    userAnswerYear,
    setUserAnswerYear,
    userAnswerMonth,
    setUserAnswerMonth,
    userAnswerDay,
    setUserAnswerDay,
  } = useContext(AppContext);

  const isReady = Boolean(gameData && currentImage);

  useEffect(() => {
    if (currentImage) setLoadingImg(true);
  }, [currentImage, setLoadingImg]);

  const imgUrl = useMemo(() => {
    if (!isReady) return "";
    return buildPublicUrl(`data/game/${currentImage.image_path}`);
  }, [gameData, currentImage, isReady]);

  const userAnswerText = useMemo(() => {
    const m = MONTH_ARRAY[Number(userAnswerMonth)] ?? "";
    return `${userAnswerDay} ${m} ${userAnswerYear}`;
  }, [userAnswerDay, userAnswerMonth, userAnswerYear]);

  const years = useMemo(
    () => Array.from({ length: 13 }, (_, i) => String(2012 + i)),
    []
  );

  if (!isReady) {
    return (
      <Card size="3">
        <Flex justify="center" align="center" direction="column" gap="3">
          <Spinner size="3" />
          <Text size="2">Laddar...</Text>
        </Flex>
      </Card>
    );
  }

  return (
    <>
      <Card size="3">
        <Flex direction="column" justify="center" gap="5">
          <Flex justify="center">
            <Heading>{currentImage.image_quesiton}</Heading>
          </Flex>

          <Flex justify="center">
            <Flex justify="center" align="center">
              <img
                src={imgUrl}
                className="img-container"
                style={{ display: loadingImg ? "none" : "block" }}
                onLoad={() => setLoadingImg(false)}
                onError={() => {
                  setLoadingImg(false);
                  console.error("Image failed to load:", imgUrl);
                }}
                alt={currentImage.image_description ?? "game image"}
              />

              {loadingImg && (
                <Flex
                  width="20rem"
                  height="20rem"
                  justify="center"
                  align="center"
                  direction="column"
                  gap="2"
                >
                  <Spinner size="3" />
                  <Text size="2">Laddar bild...</Text>
                </Flex>
              )}
            </Flex>
          </Flex>
        </Flex>
      </Card>

      <Card size="3">
        <Flex direction="column" justify="center" gap="5">
          <Flex justify="center">
            <Text>
              Ditt svar: <strong>{userAnswerText}</strong>
            </Text>
          </Flex>

          <Flex align="center" justify="center" gap="3" wrap="wrap">
            <Select.Root
              value={String(userAnswerYear)}
              size="3"
              onValueChange={(value) => setUserAnswerYear(value)}
            >
              <Select.Trigger />
              <Select.Content>
                <Select.Group>
                  <Select.Label>År</Select.Label>
                  {years.map((y) => (
                    <Select.Item key={y} value={y}>
                      {y}
                    </Select.Item>
                  ))}
                </Select.Group>
              </Select.Content>
            </Select.Root>

            <Select.Root
              value={String(userAnswerMonth)}
              size="3"
              onValueChange={(value) => setUserAnswerMonth(value)}
            >
              <Select.Trigger />
              <Select.Content>
                <Select.Group>
                  <Select.Label>Månad</Select.Label>
                  {MONTH_ARRAY.map((label, idx) => (
                    <Select.Item key={idx} value={String(idx)}>
                      {label}
                    </Select.Item>
                  ))}
                </Select.Group>
              </Select.Content>
            </Select.Root>

            <Select.Root
              value={String(userAnswerDay)}
              size="3"
              onValueChange={(value) => setUserAnswerDay(value)}
            >
              <Select.Trigger />
              <Select.Content>
                <Select.Group>
                  <Select.Label>Dag</Select.Label>
                  {Array.from({ length: 31 }, (_, i) => String(i + 1)).map((d) => (
                    <Select.Item key={d} value={d}>
                      {d}
                    </Select.Item>
                  ))}
                </Select.Group>
              </Select.Content>
            </Select.Root>
          </Flex>

          <Flex justify="center" gap="3">
            <Button
              variant="soft"
              onClick={answer}
              size="3"
              disabled={loadingImg}
            >
              Svara
            </Button>
          </Flex>
        </Flex>
      </Card>
    </>
  );
}
