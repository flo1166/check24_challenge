import React from 'react';

const Card = ({ data }) => {
  const { title, body } = data.content; 

  return (
    <div style={{ padding: '10px', border: '1px solid #ccc', margin: '10px', backgroundColor: '#f9f9f9' }}>
      <h3>{title || "Default Card Title"}</h3>
      <p>{body || "Default Card body content."}</p>
      <small>Type: Card</small>
    </div>
  );
};

export default Card;