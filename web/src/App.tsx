// Routing only (spec §10): welcome | onboarding | room; ?artsheet=1 shows the art contact sheet.
import { useState } from "react";
import ArtSheet from "./art/ArtSheet";
import { useGame } from "./hooks/useGame";
import { Welcome } from "./screens/Welcome";
import { Onboarding } from "./screens/Onboarding";
import { Room } from "./screens/Room";
import { Footer } from "./ui/Footer";
import { UrgentHelpCard } from "./ui/UrgentHelpCard";
import { ui } from "./copy/en/ui";

type Screen = "welcome" | "onboarding" | "room";

const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();

export default function App() {
  if (params.get("artsheet") === "1") return <ArtSheet />;
  return <Game />;
}

function Game() {
  const game = useGame(ui.app.savingOff);
  const [screen, setScreen] = useState<Screen>("welcome");
  const [help, setHelp] = useState(false);
  const profile = game.save.profile;
  const current: Screen = screen === "room" && !profile ? "welcome" : screen;

  return (
    <div className="app">
      {game.toast && <div className="toast" role="status">{game.toast}</div>}
      {current === "room" && profile ? (
        <Room
          key={`${game.save.installSeed}-${game.save.flags.isDemo}`}
          game={game}
          onExit={() => setScreen("welcome")}
          onDeleted={() => {
            setScreen("welcome");
            game.showToast(ui.footer.deleted);
          }}
        />
      ) : current === "onboarding" ? (
        <Onboarding
          onCancel={() => setScreen("welcome")}
          onDone={(p) => {
            game.saveProfile(p);
            setScreen("room");
          }}
        />
      ) : (
        <>
          <Welcome
            savedName={!game.save.flags.isDemo && profile ? profile.name : null}
            onContinue={() => setScreen("room")}
            onMeet={() => {
              if (game.save.flags.isDemo) game.exitDemo();
              setScreen("onboarding");
            }}
            onDemo={() => {
              game.startDemo();
              setScreen("room");
            }}
          />
          <Footer
            name={!game.save.flags.isDemo && profile ? profile.name : null}
            onHelp={() => setHelp(true)}
            onDelete={async () => {
              await game.deleteAll();
              game.showToast(ui.footer.deleted);
            }}
          />
          {help && <UrgentHelpCard onClose={() => setHelp(false)} />}
        </>
      )}
    </div>
  );
}
