---
title: "Labbo"
description: "A full-stack SaaS platform built for the film photography industry to streamline image transfer and cloud storage"
tags: ["React", "Django", "Tailwind", "Tanstack Query", "Fly.IO"]
heroImage: "https://assets.joenoseph.co.uk/programming/header.jpg"
role: "Co-Founder & Lead Engineer"
date: 2030-01-01
dateRange: "2025 - Present"
platform: "Web"
url: "https://www.labbo.co.uk"
---

## Description

Labbo is a full-stack SaaS platform built for the film photography industry.

At its core it is an image transfer and cloud storage service built specifically for the needs of film photographers, and film labs. This helps film photographers by giving them an easier to use solution for tracking their downloadable files, an automatic backup to cloud and a modern, web and mobile friendly frontend so they can access and view their photos from anywhere.

Labbo also strives to help film labs, with streamlining their ability to transfer thousands of images to their customers every day, whilst also giving admin tooling, integrations into popular commerce platforms and a loop so their customers consistently return.

## Tech Stack

As primarily a games UI engineer, this was my first large full-stack web project. Having some knowledge with Javascript and Python from previous projects, and wanting to learn popular frameworks that are currently used by companies, I landed on React + Typescript as my frontend and Django.

On top of this I am using:

- **TailwindCSS** - This is another popular framework which I am loving to use as the shorthand notation is easy to remember and change quickly when prototyping layouts
- **PostgreSQL** - A widely popular and hugely supported database system.
- **Tanstack Query** - A library for performance focussed API querying with built in caching
- **Zod** - A data validation tool to help with form inputs and keeping consistent schemas for data across pages
- **Posthog** - A great tool for analytics tracking to help inform future decisions based on real user testing

During this project I have also incorporated using AI empowered workflows to speed up development, as I am the sole engineer on the project, with using Cursor and frontier models where applicable. This has been incredibly useful for me to learn new technologies in-situ without having to get stuck searching threads for potential solutions on annoying problems. I am very conscious with my AI usage and try to use it as a learning tool first and foremost, instead of a 'hands off' approach to development.

## Challenges

One of the main challenges, as a bootstrapped project, is to keep infrastructure costs as low as possible to give us the longest possible runway to prove out an idea. This caused some anxiety as weighing up costs vs features for particular infrastructure platforms became very important. As an example, I first off started using AWS S3 as the image store for all uploaded content, as I thought this would give us the best future proofed solution. However after a long and arduous time during setup, which AWS is renowned for, I realised costs were actually projected to be quite high. This resulted in a jump to Backblaze B2 as they had drastically lower prices and importantly free egress to Cloudflare with which the domain was hosted. Luckily Backblaze has a lot of S3 interoperability so not a huge amount of backend code had to be re-written, however it was still a valuable lesson learned.

Another challenge, outside of the core engineering space, is motivation. Staying motivated on a self-funded side project seems to come in waves. Some weeks it is very easy to build systems and plan where we want to go, however this is contrasted with self-doubt and difficulty in believing that it is worth carrying on development. Luckily, Labbo is a project I am incredibly passionate about and is a platform I use personally already, so I immediately see the benefits for continuing to build.
