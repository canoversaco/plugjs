import React from "react";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";

export default class MysteryBoxUserView extends React.Component {
  state = {
    boxes: [],
    produkte: this.props.produkte || [], // Nutze produkte aus den Props
    selectedBox: null,
    opening: false,
    won: null,
    message: "",
    boxHistory: [],
    loading: true,
  };

  async componentDidMount() {
    await this.loadData();
  }

  async loadData() {
    try {
      this.setState({ loading: true });
      
      // Boxen laden
      const boxSnap = await getDocs(collection(db, "mysteryBoxes"));
      const boxes = boxSnap.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          produkte: Array.isArray(data.produkte) ? data.produkte : [],
        };
      });

      // Produkte müssen nicht neu geladen werden, da sie als Prop übergeben werden
      const produkte = this.props.produkte || [];

      // User-BoxHistory
      let boxHistory = [];
      if (this.props.user?.boxHistory && Array.isArray(this.props.user.boxHistory)) {
        boxHistory = this.props.user.boxHistory;
      } else {
        const userDoc = await getDoc(doc(db, "users", this.props.user.id));
        boxHistory = userDoc.data()?.boxHistory || [];
      }
      
      this.setState({ 
        boxes, 
        produkte, 
        boxHistory, 
        loading: false 
      });
    } catch (e) {
      this.setState({
        message: "❌ Fehler beim Laden der Daten",
        loading: false,
      });
    }
  }

  getProdukt = (produktId) => {
    return this.state.produkte.find((p) => p.id === produktId);
  };

  draw(box) {
    if (!box.produkte || !box.produkte.length) {
      this.setState({ message: "❌ Diese Box hat keine Inhalte!" });
      return null;
    }
    const totalChance = box.produkte.reduce(
      (sum, p) => sum + (Number(p.chance) || 0),
      0
    );
    if (Math.abs(totalChance - 100) > 0.1) {
      console.warn(`Chance-Summe ist ${totalChance}% (Box ${box.id})`);
    }
    const roll = Math.random() * 100;
    let acc = 0;
    for (const p of box.produkte) {
      acc += Number(p.chance) || 0;
      if (roll < acc) return p.produktId;
    }
    return box.produkte[box.produkte.length - 1]?.produktId || null;
  }

  handleOpenBox = async () => {
    const { selectedBox, opening } = this.state;
    const { user } = this.props;
    if (!selectedBox || opening) return;

    if (!selectedBox.produkte?.length) {
      this.setState({ message: "❌ Diese Box hat keine Inhalte!" });
      return;
    }
    if ((user.guthaben || 0) < selectedBox.preis) {
      this.setState({ message: "❌ Nicht genug Guthaben!" });
      return;
    }
    this.setState({ opening: true, won: null, message: "" });

    await new Promise((res) => setTimeout(res, 600 + Math.random() * 500));

    let produktId;
    try {
      produktId = this.draw(selectedBox);
      if (!produktId) throw new Error("Keine produktId erhalten");
      if (!this.state.produkte.some((p) => p.id === produktId))
        throw new Error("Produkt existiert nicht");
    } catch (error) {
      this.setState({
        message: "❌ Technischer Fehler beim Öffnen",
        opening: false,
      });
      return;
    }

    this.setState({ won: produktId });
    const produkt = this.getProdukt(produktId);

    const newEntry = {
      boxId: selectedBox.id,
      boxName: selectedBox.name,
      produktId,
      produktName: produkt?.name || "???",
      timestamp: Date.now(),
    };
    const newHistory = [newEntry, ...this.state.boxHistory].slice(0, 10);

    try {
      await updateDoc(doc(db, "users", user.id), {
        guthaben: (user.guthaben || 0) - selectedBox.preis,
        boxHistory: newHistory,
      });
      this.setState({
        boxHistory: newHistory,
        message: "🎉 Glückwunsch! Sieh nach, was du gezogen hast!",
      });
    } catch (error) {
      this.setState({ message: "❌ Fehler beim Speichern des Gewinns" });
    } finally {
      this.setState({ opening: false });
    }
  };

  render() {
    const { onGoBack, user } = this.props;
    const {
      boxes,
      produkte,
      selectedBox,
      opening,
      won,
      message,
      boxHistory,
      loading,
    } = this.state;

    return (
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(120deg,#10121a 70%,#23262e 100%)",
          color: "#fff",
          fontFamily: "'Inter',sans-serif",
          padding: 0,
          margin: 0,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "32px 0 12px 0",
            background: "linear-gradient(92deg,#181b24 90%,#23262e 100%)",
            boxShadow: "0 8px 24px #0007",
            position: "sticky",
            top: 0,
            zIndex: 2,
          }}
        >
          <button
            onClick={onGoBack}
            style={{
              marginLeft: 12,
              background: "none",
              border: 0,
              color: "#e3ff64",
              fontWeight: 900,
              fontSize: 28,
              cursor: "pointer",
            }}
            title="Zurück"
          >
            ←
          </button>
          <h2
            style={{
              flex: 1,
              color: "#e3ff64",
              textAlign: "center",
              fontWeight: 900,
              fontSize: 26,
              letterSpacing: 1.2,
              margin: 0,
            }}
          >
            Mystery Boxen
          </h2>
          <span style={{ width: 38 }} />
        </div>

        {/* Guthaben */}
        <div
          style={{
            textAlign: "center",
            margin: "22px 0 0 0",
          }}
        >
          <div style={{ fontWeight: 700, color: "#a1a1aa", fontSize: 15 }}>
            Dein Guthaben
          </div>
          <div
            style={{
              fontSize: 31,
              fontWeight: 900,
              color: "#e3ff64",
              letterSpacing: 1.2,
            }}
          >
            {user?.guthaben?.toFixed(2) ?? "0.00"} €
          </div>
        </div>

        {/* Boxen-Auswahl */}
        {loading ? (
          <div
            style={{
              textAlign: "center",
              margin: "50px auto",
              color: "#38bdf8",
              fontSize: 18,
            }}
          >
            Lade Boxen...
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 18,
              maxWidth: 450,
              margin: "28px auto 14px auto",
              padding: "0 14px",
            }}
          >
            {boxes.length > 0 ? (
              boxes.map((box) => (
                <div
                  key={box.id}
                  onClick={() => this.setState({ selectedBox: box })}
                  style={{
                    background:
                      selectedBox?.id === box.id
                        ? "linear-gradient(100deg,#e3ff6422 80%,#38bdf822 100%)"
                        : "#1a1d24",
                    border:
                      selectedBox?.id === box.id
                        ? "2.2px solid #38bdf8"
                        : "2px solid #23262e",
                    borderRadius: 15,
                    padding: "21px 10px 14px 10px",
                    cursor: "pointer",
                    boxShadow: "0 4px 18px #38bdf812",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    minHeight: 110,
                    transition: "all 0.16s",
                    outline:
                      selectedBox?.id === box.id ? "2px solid #38bdf8" : "none",
                  }}
                >
                  <div
                    style={{
                      fontWeight: 900,
                      fontSize: 19,
                      color: "#e3ff64",
                      marginBottom: 8,
                      textShadow: "0 2px 11px #e3ff6411",
                      letterSpacing: 0.17,
                    }}
                  >
                    {box.name}
                  </div>
                  <div
                    style={{
                      fontSize: 16.5,
                      fontWeight: 700,
                      color: "#38bdf8",
                      marginBottom: 8,
                      letterSpacing: 0.09,
                    }}
                  >
                    {box.preis} €
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: 5,
                      flexWrap: "wrap",
                      fontSize: 13.8,
                      color: "#fff",
                      marginBottom: 5,
                      fontWeight: 700,
                      justifyContent: "center",
                    }}
                  >
                    {box.produkte.slice(0, 3).map((p, idx) => (
                      <span
                        key={idx}
                        style={{
                          background: "#23262e",
                          borderRadius: 5,
                          padding: "2px 7px",
                          marginRight: 3,
                          color: "#e3ff64",
                          fontWeight: 800,
                          fontSize: 12.5,
                        }}
                      >
                        {this.getProdukt(p.produktId)?.name ?? "?"} ({p.chance}
                        %)
                      </span>
                    ))}
                    {box.produkte.length > 3 ? (
                      <span
                        style={{
                          color: "#38bdf8",
                          fontWeight: 700,
                          marginLeft: 4,
                        }}
                      >
                        +{box.produkte.length - 3} mehr
                      </span>
                    ) : null}
                  </div>
                  <div>
                    <button
                      style={{
                        marginTop: 7,
                        background: "#38bdf8",
                        color: "#191d23",
                        border: 0,
                        borderRadius: 7,
                        fontWeight: 900,
                        fontSize: 14.7,
                        padding: "8px 14px",
                        cursor: "pointer",
                        boxShadow: "0 1px 8px #38bdf822",
                        letterSpacing: 0.14,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        this.setState({ selectedBox: box }, () => {
                          this.handleOpenBox();
                        });
                      }}
                      disabled={opening || (user.guthaben || 0) < box.preis}
                    >
                      {opening && selectedBox?.id === box.id
                        ? "Wird geöffnet..."
                        : (user.guthaben || 0) < box.preis
                        ? "Nicht genug €"
                        : "Öffnen"}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div
                style={{
                  gridColumn: "1 / -1",
                  textAlign: "center",
                  color: "#a1a1aa",
                  marginTop: 30,
                }}
              >
                Keine Boxen verfügbar
              </div>
            )}
          </div>
        )}

        {/* Ziehungs-Animation & Gewinn */}
        {opening && (
          <div
            style={{
              margin: "34px auto 8px auto",
              maxWidth: 340,
              textAlign: "center",
              fontSize: 28,
              fontWeight: 900,
              color: "#38bdf8",
              textShadow: "0 1px 8px #38bdf822",
            }}
          >
            🎁 Öffne die Box...
            <div
              style={{
                margin: "17px auto 7px auto",
                width: 68,
                height: 68,
                borderRadius: "50%",
                border: "7px solid #e3ff64",
                borderTop: "7px solid #38bdf8",
                animation: "spin 0.8s linear infinite",
              }}
            />
          </div>
        )}

        {won && !opening && (
          <div
            style={{
              margin: "34px auto 22px auto",
              maxWidth: 360,
              background: "linear-gradient(98deg,#e3ff6411 70%,#38bdf811 100%)",
              border: "2px solid #38bdf8",
              borderRadius: 18,
              boxShadow: "0 1px 13px #38bdf833",
              textAlign: "center",
              padding: "23px 14px 18px 14px",
              fontWeight: 900,
              color: "#e3ff64",
              fontSize: 21,
            }}
          >
            🎉 Du hast gezogen:
            <div
              style={{
                fontSize: 23,
                color: "#38bdf8",
                marginTop: 5,
                fontWeight: 900,
              }}
            >
              {this.getProdukt(won)?.name ?? "Geheimnisvolles Item"}
            </div>
            {this.getProdukt(won)?.bild && (
              <img
                src={this.getProdukt(won)?.bild}
                alt="Produkt"
                style={{
                  width: 58,
                  margin: "17px 0 5px 0",
                  borderRadius: 8,
                  boxShadow: "0 3px 8px #191d2355",
                }}
              />
            )}
            <div style={{ marginTop: 7 }}>
              <button
                style={{
                  background: "#191d23",
                  color: "#e3ff64",
                  border: "1px solid #38bdf855",
                  borderRadius: 8,
                  fontWeight: 800,
                  fontSize: 15,
                  padding: "9px 17px",
                  marginTop: 10,
                  cursor: "pointer",
                }}
                onClick={() => this.setState({ won: null })}
              >
                Schließen
              </button>
            </div>
          </div>
        )}

        {/* Meldungen */}
        {message && (
          <div
            style={{
              margin: "12px auto",
              maxWidth: 360,
              background: "#181a1e",
              color: "#e3ff64",
              fontWeight: 700,
              borderRadius: 8,
              textAlign: "center",
              padding: "8px 0",
              fontSize: 15,
              boxShadow: "0 1px 7px #e3ff6432",
            }}
          >
            {message}
          </div>
        )}

        {/* History */}
        <div
          style={{
            margin: "35px auto 30px auto",
            maxWidth: 420,
            background: "#181a1e",
            borderRadius: 16,
            padding: "13px 17px 10px 17px",
            color: "#fff",
            boxShadow: "0 1px 6px #23262e22",
          }}
        >
          <div
            style={{
              fontWeight: 800,
              color: "#38bdf8",
              fontSize: 16,
              marginBottom: 7,
            }}
          >
            Deine letzten Box-Öffnungen
          </div>
          {boxHistory.length === 0 ? (
            <div style={{ color: "#a1a1aa", fontSize: 14 }}>
              Noch keine Öffnungen.
            </div>
          ) : (
            <ul
              style={{
                listStyle: "none",
                margin: 0,
                padding: 0,
                display: "flex",
                flexDirection: "column",
                gap: 7,
              }}
            >
              {boxHistory.slice(0, 7).map((h, i) => (
                <li
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    background: "#23262e",
                    borderRadius: 7,
                    padding: "7px 8px",
                    fontSize: 14.2,
                  }}
                >
                  <span style={{ fontWeight: 800, color: "#e3ff64" }}>
                    {h.boxName}
                  </span>
                  <span
                    style={{ color: "#38bdf8", fontWeight: 700, marginLeft: 7 }}
                  >
                    {this.getProdukt(h.produktId)?.name ?? "?"}
                  </span>
                  <span
                    style={{
                      color: "#a1a1aa",
                      marginLeft: "auto",
                      fontSize: 12.5,
                    }}
                  >
                    {new Date(h.timestamp).toLocaleDateString("de-DE", {
                      day: "2-digit",
                      month: "2-digit",
                    })}{" "}
                    {new Date(h.timestamp).toLocaleTimeString("de-DE", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg);}
            100% { transform: rotate(360deg);}
          }
        `}</style>
      </div>
    );
  }
}
