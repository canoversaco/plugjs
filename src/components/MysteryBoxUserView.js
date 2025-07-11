import React from "react";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";

// --- SOUNDS (mp3 im public/sounds/) ---
const soundBoxOpen = "/sounds/box_open.mp3"; // Sound abspielen, wenn Box geöffnet wird
const soundWin = "/sounds/win.mp3"; // Sound bei Gewinn
const soundCoin = "/sounds/coin.mp3"; // Sound bei Umtausch

// --- Utility für Bilder ---
const BILD_URL = (produkt) =>
  produkt?.bildName
    ? `/images/produkte/${produkt.bildName}.webp`
    : "/images/produkte/placeholder.webp";

// --- Utility für Sound abspielen ---
const playSound = (src, volume = 1) => {
  try {
    const audio = new window.Audio(src);
    audio.volume = volume;
    audio.play();
  } catch {}
};

export default class MysteryBoxUserView extends React.Component {
  state = {
    boxes: [],
    produkte: [],
    selectedBox: null,
    opening: false,
    won: null,
    message: "",
    boxHistory: [],
    loading: true,
    showWinModal: false,
    actionLoading: false,
    orderLoading: false,
    swapLoading: false,
  };

  async componentDidMount() {
    await this.loadData();
  }

  async loadData() {
    try {
      this.setState({ loading: true });
      const boxSnap = await getDocs(collection(db, "mysteryBoxes"));
      const boxes = boxSnap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
        items: Array.isArray(docSnap.data().items) ? docSnap.data().items : [],
      }));

      const produktSnap = await getDocs(collection(db, "produkte"));
      const produkte = produktSnap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));

      const userDoc = await getDoc(doc(db, "users", this.props.user.id));
      const userData = userDoc.data();
      const boxHistory = userData?.boxHistory || [];

      this.setState({
        boxes,
        produkte,
        boxHistory,
        loading: false,
      });
    } catch (e) {
      this.setState({
        message: "❌ Fehler beim Laden der Daten",
        loading: false,
      });
    }
  }

  getProdukt = (produktId) => {
    if (!produktId) return null;
    return this.state.produkte.find((p) => String(p.id) === String(produktId));
  };

  draw(box) {
    if (!box.items || !box.items.length) {
      this.setState({ message: "❌ Diese Box hat keine Inhalte!" });
      return null;
    }
    const roll = Math.random() * 100;
    let acc = 0;
    for (const p of box.items) {
      acc += Number(p.wahrscheinlichkeit) || 0;
      if (roll < acc) return p.produktId;
    }
    return box.items[box.items.length - 1]?.produktId || null;
  }

  handleOpenBox = async () => {
    const { selectedBox, opening } = this.state;
    const { user } = this.props;
    if (!selectedBox || opening) return;

    if (!selectedBox.items?.length) {
      this.setState({ message: "❌ Diese Box hat keine Inhalte!" });
      return;
    }
    if ((user.guthaben || 0) < selectedBox.preis) {
      this.setState({ message: "❌ Nicht genug Guthaben!" });
      return;
    }
    this.setState({ opening: true, won: null, message: "" });

    playSound(soundBoxOpen, 0.8);
    await new Promise((res) => setTimeout(res, 1200 + Math.random() * 600));

    let produktId;
    try {
      produktId = this.draw(selectedBox);
      const produkt = this.getProdukt(produktId);
      if (!produktId) throw new Error("Keine produktId erhalten");
      if (!produkt)
        throw new Error(`Produkt mit ID ${produktId} existiert nicht`);

      playSound(soundWin, 1);

      this.setState({ won: produktId, showWinModal: true });

      const newEntry = {
        boxId: selectedBox.id,
        boxName: selectedBox.name,
        produktId,
        produktName: produkt.name || "???",
        produktBild: produkt.bildName || "",
        timestamp: Date.now(),
      };
      const newHistory = [newEntry, ...this.state.boxHistory].slice(0, 10);

      // INVENTAR-UPDATE
      const userDocRef = doc(db, "users", user.id);
      const userSnap = await getDoc(userDocRef);
      const currentInventory = userSnap.data()?.inventory || [];
      const newGewinn = {
        produktId,
        name: produkt.name,
        bildName: produkt.bildName,
        preis: produkt.preis,
        kategorie: produkt.kategorie,
        gewonnenAm: Date.now(),
        boxName: selectedBox.name,
        status: "verfügbar",
        bestellDatum: null,
      };
      await updateDoc(userDocRef, {
        guthaben: (user.guthaben || 0) - selectedBox.preis,
        boxHistory: newHistory,
        inventory: [newGewinn, ...currentInventory].slice(0, 50),
      });

      this.setState({
        boxHistory: newHistory,
        message: "",
      });
    } catch (error) {
      this.setState({
        message: "❌ Technischer Fehler beim Öffnen: " + error.message,
      });
    } finally {
      this.setState({ opening: false });
    }
  };

  // --- DIREKT BESTELLEN aus Gewinn ---
  handleOrderWin = async () => {
    const produkt = this.getProdukt(this.state.won);
    if (!produkt) return;

    this.setState({ orderLoading: true });
    // Selber Ablauf wie aus UserInventory.js:
    try {
      if (this.props.onOrderFromInventory) {
        await this.props.onOrderFromInventory(produkt);
        this.setState({ showWinModal: false, orderLoading: false });
      }
    } catch (e) {
      this.setState({
        orderLoading: false,
        message: "❌ Bestellung fehlgeschlagen",
      });
    }
  };

  // --- DIREKT UMTauschen in Guthaben ---
  handleSwapWin = async () => {
    const produkt = this.getProdukt(this.state.won);
    if (!produkt) return;

    this.setState({ swapLoading: true });
    playSound(soundCoin, 0.9);

    // Die Funktion ist exakt wie im UserInventory.js
    if (this.props.onSwapFromInventory) {
      await this.props.onSwapFromInventory(produkt);
      this.setState({ showWinModal: false, swapLoading: false });
    }
  };

  // --- ZUM INVENTAR springen ---
  handleGotoInventar = () => {
    if (this.props.onGoInventar) {
      this.setState({ showWinModal: false });
      this.props.onGoInventar();
    }
  };

  renderMysteryBox(box, selected, opening) {
    return (
      <div
        onClick={() => this.setState({ selectedBox: box })}
        style={{
          background:
            selected?.id === box.id
              ? "linear-gradient(95deg, #242d36 73%, #38bdf822 100%)"
              : "#191e26",
          border:
            selected?.id === box.id
              ? "2.7px solid #e3ff64"
              : "1.5px solid #22242d",
          borderRadius: 26,
          padding: "36px 18px 28px 18px",
          minHeight: 235,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          position: "relative",
          cursor: "pointer",
          boxShadow:
            selected?.id === box.id
              ? "0 2px 28px #38bdf822, 0 1px 6px #e3ff6412"
              : "0 3px 17px #22242b18",
          transform: selected?.id === box.id ? "scale(1.07)" : "scale(1)",
          transition: "all 0.23s cubic-bezier(.5,1.5,.25,1)",
          animation:
            selected?.id === box.id
              ? "bounceUp 0.58s cubic-bezier(.6,1.7,.5,1.01)"
              : "",
        }}
      >
        <div
          style={{
            fontWeight: 900,
            fontSize: 23,
            color: "#e3ff64",
            marginBottom: 6,
            letterSpacing: 0.19,
            textShadow: "0 1px 12px #e3ff6422",
            display: "flex",
            alignItems: "center",
            gap: 7,
          }}
        >
          <span
            style={{
              filter: "drop-shadow(0 2px 7px #38bdf855)",
              fontSize: 27,
            }}
          >
            🎁
          </span>
          {box.name}
        </div>
        <div
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: "#38bdf8",
            marginBottom: 13,
            letterSpacing: 0.11,
            display: "flex",
            alignItems: "center",
            gap: 5,
          }}
        >
          <span role="img" aria-label="euro">
            💶
          </span>{" "}
          {box.preis} €
        </div>
        <div style={{ width: "100%", minHeight: 36, marginBottom: 11 }}>
          {this.renderBoxProducts(box)}
        </div>
        <button
          style={{
            marginTop: 15,
            background: "linear-gradient(90deg,#38bdf8,#e3ff64 100%)",
            color: "#10121a",
            border: 0,
            borderRadius: 13,
            fontWeight: 900,
            fontSize: 17,
            padding: "10px 37px",
            cursor:
              opening || (this.props.user.guthaben || 0) < box.preis
                ? "not-allowed"
                : "pointer",
            boxShadow: "0 2px 12px #38bdf822",
            letterSpacing: 0.13,
            opacity: opening && selected?.id === box.id ? 0.65 : 1,
            filter: opening ? "blur(0.7px)" : "none",
            transition: "all .13s",
            display: "flex",
            alignItems: "center",
            gap: 7,
          }}
          onClick={(e) => {
            e.stopPropagation();
            this.setState({ selectedBox: box }, () => {
              this.handleOpenBox();
            });
          }}
          disabled={opening || (this.props.user.guthaben || 0) < box.preis}
        >
          <span role="img" aria-label="box">
            🪄
          </span>
          {opening && selected?.id === box.id
            ? "Box öffnet..."
            : (this.props.user.guthaben || 0) < box.preis
            ? "Nicht genug €"
            : "Öffnen"}
        </button>
        {selected?.id === box.id && (
          <div
            style={{
              pointerEvents: "none",
              position: "absolute",
              inset: 0,
              borderRadius: 28,
              background:
                "repeating-linear-gradient(120deg,#e3ff6420 0 3px,#23262e00 3px 15px)",
              opacity: 0.15,
              animation: "mysteryGlow 2.6s linear infinite alternate",
            }}
          />
        )}
        <style>
          {`
          @keyframes mysteryGlow {
            0% { opacity: 0.11 }
            100% { opacity: 0.29 }
          }
          @keyframes bounceUp {
            0% { transform: scale(1);}
            32% { transform: scale(1.13);}
            48% { transform: scale(0.94);}
            68% { transform: scale(1.08);}
            100% { transform: scale(1.07);}
          }
        `}
        </style>
      </div>
    );
  }

  renderBoxProducts(box) {
    if (!box.items?.length)
      return (
        <div style={{ color: "#a1a1aa", textAlign: "center" }}>
          Keine Produkte
        </div>
      );
    return (
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 7,
          justifyContent: "center",
        }}
      >
        {box.items.map((item, idx) => {
          const produkt = this.getProdukt(item.produktId);
          return (
            <div
              key={idx}
              style={{
                background: "#232940",
                borderRadius: 9,
                padding: "5px 10px",
                display: "flex",
                alignItems: "center",
                minWidth: 112,
                maxWidth: 150,
                margin: "0 1px 5px 1px",
                boxShadow: "0 1px 5px #0e111422",
                border: "1.1px solid #2e3240",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              <span style={{ fontSize: 17, marginRight: 6 }}>🎲</span>
              <img
                src={BILD_URL(produkt)}
                alt={produkt?.name || "?"}
                style={{
                  width: 30,
                  height: 30,
                  objectFit: "cover",
                  borderRadius: 7,
                  marginRight: 8,
                  background: "#18191c",
                  border: "1.5px solid #252529",
                  boxShadow: "0 1px 6px #25252918",
                }}
                onError={(e) => {
                  e.target.src = "/images/produkte/placeholder.webp";
                }}
              />
              <div>
                <div
                  style={{ fontWeight: 900, color: "#e3ff64", fontSize: 13.1 }}
                >
                  {produkt?.name ?? "?"}
                </div>
                <div
                  style={{ fontSize: 11.3, color: "#38bdf8", fontWeight: 700 }}
                >
                  {item.wahrscheinlichkeit}% Chance
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  render() {
    const { onGoBack, user } = this.props;
    const {
      boxes,
      selectedBox,
      opening,
      won,
      showWinModal,
      message,
      boxHistory,
      loading,
      orderLoading,
      swapLoading,
    } = this.state;

    // Gewinn-Produkt holen
    const winProdukt = won ? this.getProdukt(won) : null;

    return (
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(120deg,#10121a 82%,#23262e 100%)",
          color: "#fff",
          fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
        }}
      >
        {/* HEADER */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "29px 0 14px 0",
            background: "linear-gradient(92deg,#181b24 88%,#23262e 100%)",
            boxShadow: "0 8px 24px #0007",
            position: "sticky",
            top: 0,
            zIndex: 2,
          }}
        >
          <button
            onClick={onGoBack}
            style={{
              marginLeft: 17,
              background: "none",
              border: 0,
              color: "#e3ff64",
              fontWeight: 900,
              fontSize: 28,
              cursor: "pointer",
            }}
            title="Zurück"
          >
            <span role="img" aria-label="zurück">
              🔙
            </span>
          </button>
          <h2
            style={{
              flex: 1,
              color: "#e3ff64",
              textAlign: "center",
              fontWeight: 900,
              fontSize: 29,
              letterSpacing: 1.7,
              margin: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <span role="img" aria-label="gift">
              🎁
            </span>{" "}
            Mystery Boxen
          </h2>
          <span style={{ width: 38 }} />
        </div>

        {/* Guthaben */}
        <div style={{ textAlign: "center", margin: "24px 0 0 0" }}>
          <div style={{ fontWeight: 700, color: "#a1a1aa", fontSize: 16 }}>
            Guthaben
          </div>
          <div
            style={{
              fontSize: 37,
              fontWeight: 900,
              color: "#e3ff64",
              letterSpacing: 1.7,
              marginTop: 2,
            }}
          >
            <span role="img" aria-label="money">
              💸
            </span>{" "}
            {user?.guthaben?.toFixed(2) ?? "0.00"} €
          </div>
        </div>

        {/* Boxen-Auswahl */}
        {loading ? (
          <div
            style={{
              textAlign: "center",
              margin: "62px auto",
              color: "#38bdf8",
              fontSize: 23,
              letterSpacing: 1.1,
            }}
          >
            <span role="img" aria-label="load">
              ⏳
            </span>{" "}
            Lade Boxen...
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: 38,
              maxWidth: 1100,
              margin: "44px auto 24px auto",
              padding: "0 18px",
              alignItems: "start",
            }}
          >
            {boxes.length > 0 ? (
              boxes.map((box) =>
                this.renderMysteryBox(box, selectedBox, opening)
              )
            ) : (
              <div
                style={{
                  gridColumn: "1 / -1",
                  textAlign: "center",
                  color: "#a1a1aa",
                  marginTop: 30,
                }}
              >
                <span role="img" aria-label="nix">
                  😶‍🌫️
                </span>{" "}
                Keine Boxen verfügbar
              </div>
            )}
          </div>
        )}

        {/* Ziehungs-Animation */}
        {opening && (
          <div
            style={{
              margin: "70px auto 15px auto",
              maxWidth: 330,
              textAlign: "center",
              fontSize: 31,
              fontWeight: 900,
              color: "#38bdf8",
              textShadow: "0 1px 8px #38bdf822",
            }}
          >
            <div>🎁 Die Box dreht...</div>
            <div className="pop-anim-wrap">
              <div className="pop-anim"></div>
            </div>
            <style>{`
              .pop-anim-wrap {
                margin: 23px auto 7px auto;
                width: 82px;
                height: 82px;
                display: flex;
                align-items: center;
                justify-content: center;
              }
              .pop-anim {
                width: 66px;
                height: 66px;
                border-radius: 19px 13px 15px 17px;
                background: linear-gradient(112deg, #191d23 80%, #38bdf8 120%);
                border: 5px solid #38bdf8;
                border-top: 5px solid #e3ff64;
                box-shadow: 0 2px 28px #38bdf877, 0 2px 8px #10121a44;
                animation: boxSpin 1.2s cubic-bezier(.4,.7,.4,1) infinite;
                position: relative;
              }
              .pop-anim::before {
                content: "";
                display: block;
                position: absolute;
                left: 50%; top: -11px;
                transform: translateX(-50%);
                width: 39px; height: 14px;
                border-radius: 8px 8px 7px 7px/7px 7px 7px 7px;
                background: linear-gradient(92deg, #e3ff64 60%, #38bdf8 120%);
                box-shadow: 0 2px 10px #e3ff6455;
              }
              @keyframes boxSpin {
                0% { transform: rotate(0deg);}
                100% { transform: rotate(360deg);}
              }
            `}</style>
          </div>
        )}

        {/* Gewinn-Popup */}
        {showWinModal && winProdukt && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(18,22,30,0.94)",
              zIndex: 99,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              animation: "modalfade .28s cubic-bezier(.1,.75,.3,1)",
            }}
          >
            <div
              style={{
                background: "linear-gradient(108deg,#161d23 85%,#23262e 100%)",
                border: "2.4px solid #e3ff64",
                borderRadius: 23,
                minWidth: 320,
                maxWidth: 390,
                boxShadow: "0 8px 44px #38bdf877",
                padding: "36px 29px 28px 29px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                animation: "popfade .8s cubic-bezier(.15,1.9,.5,.87)",
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 18,
                  right: 19,
                  cursor: "pointer",
                  fontWeight: 900,
                  color: "#a1a1aa",
                  fontSize: 23,
                }}
                title="Schließen"
                onClick={() => this.setState({ showWinModal: false })}
              >
                ✖️
              </div>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 900,
                  color: "#e3ff64",
                  marginBottom: 13,
                  letterSpacing: 0.21,
                  textShadow: "0 1px 14px #e3ff6455",
                }}
              >
                🎉 Glückwunsch!
              </div>
              <img
                src={BILD_URL(winProdukt)}
                alt="Produkt"
                style={{
                  width: 85,
                  height: 85,
                  borderRadius: 15,
                  boxShadow: "0 3px 24px #10121a66",
                  border: "2.7px solid #38bdf8",
                  background: "#191d23",
                  objectFit: "cover",
                  marginBottom: 13,
                  animation: "popfade .86s cubic-bezier(.2,2.1,.6,.95)",
                }}
                onError={(e) => {
                  e.target.src = "/images/produkte/placeholder.webp";
                }}
              />
              <div
                style={{
                  color: "#38bdf8",
                  fontWeight: 800,
                  fontSize: 20,
                  marginBottom: 4,
                }}
              >
                {winProdukt?.name ?? "Geheimnisvolles Item"}
              </div>
              <div style={{ color: "#e3ff64", fontWeight: 500, fontSize: 14 }}>
                Kategorie: {winProdukt?.kategorie ?? "-"}
              </div>
              <div style={{ color: "#a1a1aa", fontSize: 13, marginBottom: 15 }}>
                Wert: {winProdukt?.preis ? winProdukt.preis + " €" : "-"}
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 11,
                  marginTop: 12,
                  flexWrap: "wrap",
                  justifyContent: "center",
                }}
              >
                <button
                  style={{
                    background: "#38bdf8",
                    color: "#191d23",
                    border: "0",
                    borderRadius: 11,
                    fontWeight: 900,
                    fontSize: 16,
                    padding: "11px 24px",
                    cursor: orderLoading ? "wait" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                  }}
                  onClick={this.handleOrderWin}
                  disabled={orderLoading}
                  title="Jetzt direkt bestellen!"
                >
                  <span role="img" aria-label="order">
                    🛒
                  </span>{" "}
                  Bestellen
                </button>
                <button
                  style={{
                    background: "#191d23",
                    color: "#38bdf8",
                    border: "1.7px solid #38bdf888",
                    borderRadius: 11,
                    fontWeight: 900,
                    fontSize: 16,
                    padding: "11px 19px",
                    cursor: swapLoading ? "wait" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                  onClick={this.handleSwapWin}
                  disabled={swapLoading}
                  title="In Guthaben tauschen"
                >
                  <span role="img" aria-label="swap">
                    💱
                  </span>{" "}
                  Umtauschen
                </button>
                <button
                  style={{
                    background: "#e3ff64",
                    color: "#181b1e",
                    border: 0,
                    borderRadius: 11,
                    fontWeight: 900,
                    fontSize: 16,
                    padding: "11px 18px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                  onClick={this.handleGotoInventar}
                  title="Zum Inventar"
                >
                  <span role="img" aria-label="inventar">
                    🎒
                  </span>{" "}
                  Inventar
                </button>
              </div>
            </div>
            <style>{`
              @keyframes modalfade { 0% { opacity: 0; } 100% { opacity: 1; } }
              @keyframes popfade {
                0% { opacity: 0; transform: scale(.8);}
                70% { opacity: 1; transform: scale(1.1);}
                100% { opacity: 1; transform: scale(1);}
              }
            `}</style>
          </div>
        )}

        {/* Meldungen */}
        {message && (
          <div
            style={{
              margin: "12px auto",
              maxWidth: 390,
              background: "#181a1e",
              color: "#e3ff64",
              fontWeight: 700,
              borderRadius: 9,
              textAlign: "center",
              padding: "10px 0",
              fontSize: 15,
              boxShadow: "0 1px 10px #e3ff6444",
            }}
          >
            {message}
          </div>
        )}

        {/* History */}
        <div
          style={{
            margin: "43px auto 32px auto",
            maxWidth: 500,
            background: "#181a1e",
            borderRadius: 21,
            padding: "19px 28px 17px 28px",
            color: "#fff",
            boxShadow: "0 1px 12px #23262e22",
          }}
        >
          <div
            style={{
              fontWeight: 800,
              color: "#38bdf8",
              fontSize: 17,
              marginBottom: 8,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span role="img" aria-label="clock">
              🕑
            </span>{" "}
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
                gap: 10,
              }}
            >
              {boxHistory.slice(0, 7).map((h, i) => {
                const produkt = this.getProdukt(h.produktId);
                return (
                  <li
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      background: "#23262e",
                      borderRadius: 8,
                      padding: "10px 12px",
                      fontSize: 14.8,
                      animation:
                        "fadeIn .54s cubic-bezier(.21,1.1,.6,.99) both",
                      animationDelay: `${i * 0.09}s`,
                    }}
                  >
                    <img
                      src={BILD_URL(produkt)}
                      alt={produkt?.name || "?"}
                      style={{
                        width: 33,
                        height: 33,
                        borderRadius: 6,
                        marginRight: 7,
                        background: "#191d23",
                        border: "1px solid #333",
                        objectFit: "cover",
                      }}
                      onError={(e) => {
                        e.target.src = "/images/produkte/placeholder.webp";
                      }}
                    />
                    <span
                      style={{
                        fontWeight: 900,
                        color: "#e3ff64",
                        minWidth: 80,
                      }}
                    >
                      {h.boxName}
                    </span>
                    <span
                      style={{
                        color: "#38bdf8",
                        fontWeight: 700,
                        marginLeft: 4,
                        minWidth: 90,
                      }}
                    >
                      {produkt?.name ?? "?"}
                    </span>
                    <span
                      style={{
                        color: "#a1a1aa",
                        marginLeft: "auto",
                        fontSize: 13,
                        whiteSpace: "nowrap",
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
                );
              })}
            </ul>
          )}
          <style>{`
            @keyframes fadeIn {
              0% { opacity: 0; transform: translateY(30px);}
              100% { opacity: 1; transform: translateY(0);}
            }
          `}</style>
        </div>
      </div>
    );
  }
}
