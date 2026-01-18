import {
  Card,
  Flex,
  Heading,
  TextField,
  Button,
  Badge,
  Table,
} from "@radix-ui/themes";
import { LockClosedIcon } from "@radix-ui/react-icons";
import { useState, useContext } from "react";
import { AppContext } from "src/contexts/AppContext";

export default function SessionLoginView() {
  const { gameData, startGame } = useContext(AppContext);

  const [password, setPassword] = useState("");
  const [hasError, setHasError] = useState(false);
  const errorColor = hasError ? "red" : undefined;

  const [history, setHistory] = useState(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem("history") || "[]");
      return Array.isArray(parsed) && parsed.length ? parsed : null;
    } catch {
      return null;
    }
  });

  const handleUpdatePassword = (event) => {
    setPassword(event.target.value);
    setHasError(false);
  };

  const handleStartGame = (event) => {
    event.preventDefault();
    const success = startGame(password);
    setHasError(!success);
    setPassword("");
  };

  const handleRemoveHistory = () => {
    setHistory(null);
    localStorage.removeItem("history");
  };

  return (
    <>
      <Card size={"3"}>
        <form onSubmit={handleStartGame}>
          <Flex direction={"column"} justify={"center"} gap={"5"}>
            <Flex justify={"center"}>
              <Heading as="h2" size={"5"}>
                {gameData?.screen_name}
              </Heading>
            </Flex>
            <Flex justify={"center"} align={"center"} direction={"column"}>
              <TextField.Root
                placeholder="Session password"
                value={password}
                onChange={handleUpdatePassword}
                color={errorColor}
                size={"3"}
              >
                <TextField.Slot>
                  <LockClosedIcon />
                </TextField.Slot>
              </TextField.Root>
              {hasError && (
                <Flex
                  direction={"column"}
                  align={"start"}
                  justify={"center"}
                  pt={"2"}
                >
                  <Badge variant="outline" size="2" color="red">
                    Wrong password
                  </Badge>
                </Flex>
              )}
            </Flex>
            <Flex justify={"center"}>
              <Button
                variant="soft"
                size={"3"}
                color={errorColor}
                onClick={handleStartGame}
                type="submit"
              >
                Enter session
              </Button>
            </Flex>
          </Flex>
        </form>
      </Card>
      {Array.isArray(history) && (
        <>
          <Card size={"3"}>
            <Flex direction={"column"} justify={"center"} gap={"5"}>
              <Table.Root>
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeaderCell>Session</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Score</Table.ColumnHeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {history.map((session, index) => {
                    return (
                      <Table.Row key={`${session.sessionName}-${index}`}>
                        <Table.RowHeaderCell>
                          {session.sessionName}
                        </Table.RowHeaderCell>
                        <Table.Cell>{session.totalScore}</Table.Cell>
                      </Table.Row>
                    );
                  })}
                </Table.Body>
              </Table.Root>
            </Flex>
          </Card>
          <Flex justify={"center"}>
            <Button variant="soft" size={"3"} onClick={handleRemoveHistory}>
              Clear history
            </Button>
          </Flex>
        </>
      )}
    </>
  );
}
