import { useState } from "react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { Heading, Row, Segmented, Toggle } from "./controls";
import { CodeBorderColor, PlayerPrefs, Settings, updateSettings } from "./useSettings";
import { GITHUB_REPO_URL } from "../launcher/httpCodes";
import { playerName } from "../media/useMedia";
import { isMac } from "../island/env";

const BORDER_COLOR_OPTIONS: { value: CodeBorderColor; label: string }[] = [
  { value: "code", label: "Цвет кода" },
  { value: "theme", label: "Тема программы" },
];

/**
 * Расширенные: hidden until 10 taps on the logo in О Lumen. Apps music is
 * taken from, the HTTP codes and network protocols lookup (off by default),
 * its card's look, Protocol-list.
 */
export function AdvancedSection({ settings }: { settings: Settings }) {
  const advanced = settings.advanced;

  const setAdvanced = (patch: Partial<typeof advanced>) =>
    updateSettings({ advanced: patch });

  return (
    <>
      <Heading>Источники музыки</Heading>
      <MusicSources players={settings.players} />

      <Heading>Справочник кодов и протоколов</Heading>
      <div className="st-card">
        <Row title="Справочник в поиске" hint="h:404, h:dns, h:wireguard или hHelp: — Enter открывает карточку">
          <Toggle on={advanced.lookup} onChange={(lookup) => setAdvanced({ lookup })} />
        </Row>
      </div>

      {advanced.lookup && (
        <>
          <Heading>Карточка</Heading>
          <div className="st-card">
            <Row
              title="Цвет краёв инфо-окна"
              hint="Цвет рамки и свечения выезжающего окна информации при нажатии Enter"
            >
              <Segmented
                value={advanced.codeBorderColor}
                options={BORDER_COLOR_OPTIONS}
                onChange={(codeBorderColor) => setAdvanced({ codeBorderColor })}
              />
            </Row>

            <div
              className="st-droplet-preview"
              style={
                {
                  "--preview-accent":
                    advanced.codeBorderColor === "theme" ? "var(--glow-a)" : "#4ade80",
                } as React.CSSProperties
              }
            >
              <div className="st-preview-badge">200 OK</div>
              <div className="st-preview-info">
                <span className="st-preview-title">Пример: HTTP 200 OK</span>
                <span className="st-preview-sub">
                  {advanced.codeBorderColor === "theme"
                    ? "Края и свечение окрашены в цвет темы Lumen"
                    : "Края и свечение окрашены по категории кода (зелёный для 2xx)"}
                </span>
              </div>
            </div>

            <Row
              title="Размытие стекла"
              hint="Эффект матового стекла под выезжающей каплей информации"
            >
              <Toggle
                on={advanced.dropletGlassBlur}
                onChange={(dropletGlassBlur) => setAdvanced({ dropletGlassBlur })}
              />
            </Row>
          </div>
        </>
      )}

      <Heading>Справочник Protocol-list</Heading>
      <div className="st-card">
        <Row
          title="Репозиторий на GitHub"
          hint="База сетевых протоколов и HTTP кодов от lackyhy"
        >
          <button
            type="button"
            className="st-btn-link"
            onClick={() => openUrl(GITHUB_REPO_URL)}
          >
            <svg viewBox="0 0 24 24" aria-hidden>
              <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
            </svg>
            Открыть репозиторий
          </button>
        </Row>

        <Row
          title="Быстрый переход по hHelp:"
          hint="Напиши hHelp: в поиске Lumen для мгновенного перехода в репозиторий"
        >
          <kbd className="st-key">hHelp:</kbd>
        </Row>
      </div>
      <div className="st-footnote">
        Раздел открывается десятью нажатиями на логотип в «О Lumen».{" "}
        <button className="st-link" onClick={() => setAdvanced({ unlocked: false })}>
          Спрятать раздел
        </button>
      </div>
    </>
  );
}

/**
 * Apps the island (and the Discord status) takes music from: chips of your
 * own, typed in or picked from the players seen so far, and whether only
 * they count.
 */
function MusicSources({ players }: { players: PlayerPrefs }) {
  const [draft, setDraft] = useState("");
  const { sources } = players;
  const save = (sources: string[]) => updateSettings({ players: { sources } });
  const has = (name: string) => sources.some((s) => s.toLowerCase() === name.toLowerCase());
  const add = (name: string) => {
    const app = name.trim();
    if (app && !has(app)) save([...sources, app]);
  };
  const commit = () => {
    add(draft);
    setDraft("");
  };
  const seen = players.known.filter((id) => !has(id));

  return (
    <>
      <div className="st-card">
        <Row
          title="Только из выбранных приложений"
          hint={
            sources.length
              ? "Остров и статус Discord берут трек только из приложений ниже"
              : "Сначала добавь приложение ниже — пока список пуст, музыка берётся отовсюду"
          }
        >
          <Toggle
            on={players.sourcesOnly}
            onChange={(sourcesOnly) => updateSettings({ players: { sourcesOnly } })}
          />
        </Row>
        <div className="st-row st-row-wrap">
          <div className="st-row-text">
            <div className="st-row-title">Приложения</div>
            <div className="st-row-hint">
              {isMac
                ? "Имя программы или часть её bundle id, например spotify, music или vlc"
                : "Имя программы или часть её id, например spotify, aimp или foobar2000"}
            </div>
          </div>
          <div className="st-chips">
            {sources.map((app) => (
              <span key={app} className="st-chip" title={app}>
                {playerName(app, players.names)}
                <button aria-label={`Убрать ${app}`} onClick={() => save(sources.filter((s) => s !== app))}>
                  ×
                </button>
              </span>
            ))}
            <input
              className="st-chip-input"
              value={draft}
              placeholder="Добавить…"
              spellCheck={false}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && commit()}
              onBlur={commit}
            />
          </div>
        </div>
        {seen.length > 0 && (
          <div className="st-row st-row-wrap">
            <div className="st-row-text">
              <div className="st-row-title">Уже играли</div>
              <div className="st-row-hint">Нажми, чтобы добавить в список</div>
            </div>
            <div className="st-chips">
              {seen.map((id) => (
                <button key={id} className="st-chip st-chip-add" title={id} onClick={() => add(id)}>
                  + {playerName(id, players.names)}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="st-footnote">
        {isMac
          ? "Остров видит то, что macOS показывает в «Исполняется» Пункта управления, — по одному плееру за раз: если там другое приложение, остров молчит. "
          : "Остров видит только приложения, которые сообщают Windows, что в них играет (как в панели громкости). "}
        Плееры, выключенные в «Модулях», не показываются и отсюда.
      </div>
    </>
  );
}
