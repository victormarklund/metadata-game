import { useContext, useMemo } from "react";
import { AppContext } from "src/contexts/AppContext";
import SessionLoginView from "src/views/SessionLoginView";
import GameplayView from "src/views/GameplayView";
import ResultView from "src/views/ResultView";
import { Flex, Heading } from "@radix-ui/themes";
import { APP_VIEWS } from "src/data/constants";

function App() {
  const { currentView, gameData } = useContext(AppContext);

  const header = useMemo(() => {
    switch (currentView) {
      case APP_VIEWS.SessionLoginView:
        return "metadata-hunt.io";
      case APP_VIEWS.GameplayView:
        return gameData?.screen_name ?? "metadata-hunt.io";
      case APP_VIEWS.ResultView:
        return "Result";
      default:
        return "metadata-hunt.io";
    }
  }, [currentView, gameData]);

  return (
    <div className="app-container">
      <div className="main-container">
        <Flex
          p={"5"}
          gap={"5"}
          justify={"center"}
          direction={"column"}
          pb={"7"}
        >
          <Flex direction={"column"} justify={"center"} p={"2"}>
            <Flex justify={"center"}>
              <Heading as="h1" size={"7"}>
                {header}
              </Heading>
            </Flex>
          </Flex>
          {currentView === APP_VIEWS.SessionLoginView && <SessionLoginView />}
          {currentView === APP_VIEWS.GameplayView && <GameplayView />}
          {currentView === APP_VIEWS.ResultView && <ResultView />}
        </Flex>
      </div>
    </div>
  );
}

export default App;
