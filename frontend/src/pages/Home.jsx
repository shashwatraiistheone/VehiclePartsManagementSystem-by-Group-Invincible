import React from 'react'

const cards = [
  {
    icon: '📦',
    title: 'Parts inventory',
    text: 'Add parts, set prices, and track stock levels in one place.',
  },
  {
    icon: '👤',
    title: 'Customers',
    text: 'Register customers and review purchase and service history.',
  },
  {
    icon: '🤝',
    title: 'Vendors',
    text: 'Keep supplier contacts organized for faster reordering.',
  },
]

const Home = () => {
  return (
    <div className="page">
      <div className="home-hero">
        <h1>Welcome back</h1>
        <p>
          Manage vehicle parts inventory, customers, and vendors from this dashboard. Use the
          sidebar to open each area.
        </p>
      </div>
      <div className="home-cards">
        {cards.map((c) => (
          <div key={c.title} className="home-card">
            <div className="home-card-icon" aria-hidden>
              {c.icon}
            </div>
            <h3>{c.title}</h3>
            <p>{c.text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Home
