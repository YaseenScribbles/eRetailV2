const CaptionHeadBody = ({ data, title }) => {
    return (
        <>
            <caption>{title}</caption>
            <thead>
                <tr>
                    {data.length > 0 &&
                        Object.keys(data[0]).map((key) => (
                            <th key={key}>{key.toUpperCase()}</th>
                        ))}
                </tr>
            </thead>
            <tbody>
                {data.length > 0 ? (
                    data.map((row, index) => (
                        <tr key={index}>
                            {Object.values(row).map((cell, index) => (
                                <td key={index}>{cell}</td>
                            ))}
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td className="no-data">
                            <span>No Data</span>
                        </td>
                    </tr>
                )}
            </tbody>
        </>
    );
};

export default CaptionHeadBody;
