import React, { useState, useEffect, useCallback } from "react";

// Custom hook for managing WebSocket connection
const useCoinbaseWebSocket = (selectedCrypto, selectedFiat, setPrice) => {
    useEffect(() => {
        const ws = new WebSocket("wss://ws-feed.pro.coinbase.com");
        const subscribeMessage = {
            type: "subscribe",
            product_ids: [`${selectedCrypto}-${selectedFiat}`],
            channels: ["ticker"],
        };

        ws.onopen = () => ws.send(JSON.stringify(subscribeMessage));
        ws.onmessage = (event) => {
            const { type, price: newPrice, product_id } = JSON.parse(
                event.data
            );
            if (
                type === "ticker" &&
                product_id === `${selectedCrypto}-${selectedFiat}`
            ) {
                setPrice(parseFloat(newPrice));
            }
        };

        return () => ws.close();
    }, [selectedCrypto, selectedFiat, setPrice]);
};

// Custom hook for fetching cryptocurrencies
const useFetchCryptocurrencies = (setCryptoCurrencies, setError) => {
    useEffect(() => {
        const fetchCryptocurrencies = async () => {
            try {
                const response = await fetch(
                    "https://api.pro.coinbase.com/products",
                    {
                        headers: { "Content-Type": "application/json" },
                    }
                );
                if (!response.ok)
                    throw new Error(`HTTP error! status: ${response.status}`);
                const data = await response.json();
                setCryptoCurrencies(data);
            } catch (error) {
                console.error("Error fetching crypto currencies:", error);
                setError(error.message);
            }
        };
        fetchCryptocurrencies();
    }, [setCryptoCurrencies, setError]);
};

// FiatSelect component
const FiatSelect = ({ fiatExchangeRates, selectedFiat, handleChangeFiat }) => (
    <select value={selectedFiat} onChange={handleChangeFiat}>
        {Object.keys(fiatExchangeRates).map((fiat) => (
            <option key={fiat} value={fiat}>
                {fiat}
            </option>
        ))}
    </select>
);

// CryptoSelect component
const CryptoSelect = ({
    cryptoCurrencies,
    selectedCrypto,
    handleCryptoChange,
}) => (
    <select value={selectedCrypto} onChange={handleCryptoChange}>
        {cryptoCurrencies.map((crypto) => (
            <option key={crypto.id} value={crypto.base_currency}>
                {crypto.display_name} ({crypto.id})
            </option>
        ))}
    </select>
);

const CoinbaseWebSocketFeed = () => {
    const [price, setPrice] = useState(null);
    const [error, setError] = useState("");
    const [selectedFiat, setSelectedFiat] = useState("USD");
    const [selectedCrypto, setSelectedCrypto] = useState("BTC");
    const [cryptoCurrencies, setCryptoCurrencies] = useState([]);
    const fiatExchangeRates = { INR: 82, USD: 1, EUR: 0.95, GBP: 0.81 };

    useCoinbaseWebSocket(selectedCrypto, selectedFiat, setPrice);
    useFetchCryptocurrencies(setCryptoCurrencies, setError);

    const handleChangeFiat = useCallback(
        (event) => setSelectedFiat(event.target.value),
        []
    );
    const handleCryptoChange = useCallback((event) => {
        setSelectedCrypto(event.target.value);
        setPrice(null); // Reset price
    }, []);

    const calculatedPrice =
        price && fiatExchangeRates[selectedFiat]
            ? price * fiatExchangeRates[selectedFiat]
            : "Loading...";

    if (error) return <div>Error: {error}</div>;

    return (
        <div>
            <h1>
                Real-time {selectedCrypto}-{selectedFiat} Price: {selectedFiat}{" "}
                {calculatedPrice}
            </h1>
            <FiatSelect
                fiatExchangeRates={fiatExchangeRates}
                selectedFiat={selectedFiat}
                handleChangeFiat={handleChangeFiat}
            />
            <CryptoSelect
                cryptoCurrencies={cryptoCurrencies}
                selectedCrypto={selectedCrypto}
                handleCryptoChange={handleCryptoChange}
            />
        </div>
    );
};

export default CoinbaseWebSocketFeed;
