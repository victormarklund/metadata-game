import { Card, Flex, Heading, Table, Button, Text } from "@radix-ui/themes";
import { useContext } from "react";
import { AppContext } from "src/contexts/AppContext";
import { MONTH_ARRAY } from "src/data/constants";

function formatDate(raw) {
  if (!raw) return "-";
  const month = MONTH_ARRAY[Number(raw.month)] ?? "";
  return `${raw.day} ${month} ${raw.year}`;
}

function SaveScoreButton({ disabled, onClick }) {
  return (
    <Button variant="soft" size="3" onClick={onClick} disabled={disabled}>
      Save score
    </Button>
  );
}

export default function ResultView() {
  const { resultData, totalScore, handleSaveScore } = useContext(AppContext);

  const canSave = typeof totalScore === "number";

  return (
    <>
      <Flex justify="center">
        <SaveScoreButton onClick={handleSaveScore} disabled={!canSave} />
      </Flex>

      <Card size="3">
        <Flex direction="column" align="center" justify="center" gap="5">
          <Heading>{`Total score: ${canSave ? totalScore : "-"}`}</Heading>

          <Table.Root>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell>Bild</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Ditt svar</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Rätt Svar</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Poäng</Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>

            <Table.Body>
              {(resultData ?? []).map((result, index) => {
                const ua = result.user_answer;
                const ca = result.correctAnswer?.raw;
                const userText = formatDate(ua?.raw);
                const correctText = formatDate(ca);

                return (
                  <Table.Row key={`${result.id ?? "row"}-${index}`}>
                    <Table.RowHeaderCell>
                      <Text size="1">{result.image_description}</Text>
                    </Table.RowHeaderCell>

                    <Table.Cell>
                      <Text size="1">{userText}</Text>
                    </Table.Cell>

                    <Table.Cell>
                      <Text size="1">{correctText}</Text>
                    </Table.Cell>

                    <Table.Cell>
                      <Text size="1">{typeof result.score === "number" ? result.score : "-"}</Text>
                    </Table.Cell>
                  </Table.Row>
                );
              })}
            </Table.Body>
          </Table.Root>
        </Flex>
      </Card>

      <Flex justify="center">
        <SaveScoreButton onClick={handleSaveScore} disabled={!canSave} />
      </Flex>
    </>
  );
}
