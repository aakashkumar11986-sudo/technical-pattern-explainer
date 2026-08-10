# Technical Pattern Explainer

An AI-powered technical analysis tool that computes RSI14, MA20, and MA50 
precisely in JavaScript, then uses Gemini to generate plain-language pattern 
explanations, an implied directional call (Long/Short/Hold), and rationale — 
tracked against a simulated outcome log to measure accuracy.

## Why I built this

I wanted a tool that treats technical indicator math and AI reasoning as 
separate concerns: the numbers (RSI, moving averages, support/resistance 
levels) are computed deterministically in JS, and Gemini is only used to 
interpret what those numbers mean — never to calculate them. This keeps the 
output trustworthy and lets me verify the AI's reasoning against known-correct 
math.

## Features

- **JS Indicator Engine** — RSI14, MA20, MA50, and MA alignment structure 
  computed locally from pasted CSV price data (no AI involved in the math)
- **Implied Call + Rationale** — Gemini synthesizes the computed technicals 
  into a Long/Short/Hold call with a 2-3 sentence explanation
- **Key Price Levels** — auto-derived resistance, support, confirmation 
  trigger, and invalidation threshold
- **Session History Log & Outcome Tracker** — logs every analysis, lets you 
  mark the eventual outcome, and calculates running accuracy
- Sample data for Gold, Crude Oil, S&P 500, and Nifty 50

## Tech stack

React + [Gemini API] for AI reasoning · Client-side JS for all indicator math · 
localStorage for session persistence

## Disclaimer

This is an educational tool using simulated/sample price data. It is not 
financial advice and does not represent a live trading record.

## Live demo

[link if you have one]
