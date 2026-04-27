# Demo Resumes for Overleaf

Here are 3 standard, professional resume templates built in LaTeX. They are entirely self-contained—you don't need any complex external files to compile them. Just copy each code block, create a "New Project -> Blank Project" in [Overleaf](https://www.overleaf.com), and paste the code into the `main.tex` file.

These resumes contain a rich mix of `PERSON`, `ORG`, `GPE`, `DATE`, `MONEY`, `PERCENT`, and `LANGUAGE` entities to help rigorously test the NER extraction models.

## Resume 1: Jane Doe (Software Engineer)

```latex
\documentclass[11pt,a4paper]{article}
\usepackage[margin=0.7in]{geometry}
\usepackage{hyperref}
\usepackage{enumitem}

\begin{document}
\thispagestyle{empty}

\begin{center}
    {\Huge \textbf{Jane Doe}} \\
    \vspace{2mm}
    San Francisco, CA $|$ (555) 123-4567 $|$ jane.doe@email.com \\
    \vspace{1mm}
    \href{https://linkedin.com/in/janedoe}{linkedin.com/in/janedoe} $|$ \href{https://github.com/janedoe}{github.com/janedoe}
\end{center}

\vspace{2mm}
\noindent \textbf{\large EDUCATION}
\vspace{-2mm}
\rule{\textwidth}{0.5pt}
\vspace{2mm}

\noindent \textbf{University of California, Berkeley} \hfill Berkeley, CA\\
Bachelor of Science in Computer Science \hfill Graduated: May 2022\\
CGPA: 3.9/4.0

\vspace{4mm}
\noindent \textbf{\large EXPERIENCE}
\vspace{-2mm}
\rule{\textwidth}{0.5pt}
\vspace{2mm}

\noindent \textbf{Google} \hfill San Francisco, CA\\
\textit{Software Engineer} \hfill August 2022 - Present
\begin{itemize}[leftmargin=*,noitemsep]
    \item Developed web applications using React and Node, reaching over 2 million monthly active users.
    \item Improved database query performance by 40\%, reducing latency and saving the company \$100,000 annually.
    \item Managed a \$1.2M budget for AWS cloud infrastructure, cutting operational waste by 15\%.
\end{itemize}

\vspace{2mm}
\noindent \textbf{StartupX} \hfill San Jose, CA\\
\textit{Software Engineering Intern} \hfill June 2021 - August 2021
\begin{itemize}[leftmargin=*,noitemsep]
    \item Assisted in migrating legacy backend services to Python, FastAPI, and Docker.
    \item Wrote 50+ unit tests, taking code coverage from 60\% to 85\%.
\end{itemize}

\vspace{4mm}
\noindent \textbf{\large SKILLS}
\vspace{-2mm}
\rule{\textwidth}{0.5pt}
\vspace{2mm}

\noindent \textbf{Languages:} Python, C++, JavaScript, Java, SQL, TypeScript\\
\textbf{Tools:} React, Node, AWS, Docker, Express, Git
\end{document}
```

---

## Resume 2: John Smith (Machine Learning Engineer)

```latex
\documentclass[11pt,a4paper]{article}
\usepackage[margin=0.7in]{geometry}
\usepackage{hyperref}
\usepackage{enumitem}

\begin{document}
\thispagestyle{empty}

\begin{center}
    {\Huge \textbf{John Smith}} \\
    \vspace{2mm}
    Seattle, WA $|$ (555) 987-6543 $|$ john.smith@email.com \\
    \vspace{1mm}
    \href{https://linkedin.com/in/johnsmith}{linkedin.com/in/johnsmith} $|$ \href{https://github.com/johnsmith}{github.com/johnsmith}
\end{center}

\vspace{2mm}
\noindent \textbf{\large EDUCATION}
\vspace{-2mm}
\rule{\textwidth}{0.5pt}
\vspace{2mm}

\noindent \textbf{Massachusetts Institute of Technology (MIT)} \hfill Cambridge, MA\\
Master of Science in Data Science \hfill Graduated: Dec 2020\\
CGPA: 3.8/4.0

\vspace{4mm}
\noindent \textbf{\large EXPERIENCE}
\vspace{-2mm}
\rule{\textwidth}{0.5pt}
\vspace{2mm}

\noindent \textbf{Microsoft} \hfill Seattle, WA\\
\textit{Machine Learning Engineer} \hfill January 2021 - Present
\begin{itemize}[leftmargin=*,noitemsep]
    \item Designed and deployed NLP models using Python and PyTorch that analyzed 10,000+ customer reviews daily.
    \item Increased predictive accuracy by 25\%, generating an additional \$2.5 million in revenue through targeted marketing.
    \item Mentored 3 junior developers and hosted machine learning workshops.
\end{itemize}

\vspace{2mm}
\noindent \textbf{Data Insights Corp} \hfill Boston, MA\\
\textit{Data Analyst} \hfill May 2019 - December 2020
\begin{itemize}[leftmargin=*,noitemsep]
    \item Built automated reporting dashboards using SQL and Tableau affecting 5 departments.
    \item Reduced manual data entry time by 60\%, saving approximately 20 hours per week of labor.
\end{itemize}

\vspace{4mm}
\noindent \textbf{\large SKILLS}
\vspace{-2mm}
\rule{\textwidth}{0.5pt}
\vspace{2mm}

\noindent \textbf{Languages:} Python, R, SQL, Java\\
\textbf{Tools:} PyTorch, TensorFlow, Docker, AWS, FastAPI, Tailwind
\end{document}
```

---

## Resume 3: Emily Chen (Technical Product Manager)

```latex
\documentclass[11pt,a4paper]{article}
\usepackage[margin=0.7in]{geometry}
\usepackage{hyperref}
\usepackage{enumitem}

\begin{document}
\thispagestyle{empty}

\begin{center}
    {\Huge \textbf{Emily Chen}} \\
    \vspace{2mm}
    Austin, TX $|$ (555) 555-1212 $|$ emily.chen@email.com \\
    \vspace{1mm}
    \href{https://linkedin.com/in/emilychen}{linkedin.com/in/emilychen} $|$ \href{https://github.com/emilychen}{github.com/emilychen}
\end{center}

\vspace{2mm}
\noindent \textbf{\large EDUCATION}
\vspace{-2mm}
\rule{\textwidth}{0.5pt}
\vspace{2mm}

\noindent \textbf{University of Texas at Austin} \hfill Austin, TX\\
Bachelor of Business Administration \hfill Graduated: May 2019\\
CGPA: 3.75/4.0

\vspace{4mm}
\noindent \textbf{\large EXPERIENCE}
\vspace{-2mm}
\rule{\textwidth}{0.5pt}
\vspace{2mm}

\noindent \textbf{Tesla} \hfill Austin, TX\\
\textit{Technical Product Manager} \hfill June 2021 - Present
\begin{itemize}[leftmargin=*,noitemsep]
    \item Led cross-functional teams of 15 engineers to launch a highly scalable internal portal built on React and FastAPI.
    \item Drove a 30\% increase in operational efficiency, translating to a \$500,000 cost reduction in Q1 2023.
    \item Fluent in Mandarin; facilitated negotiations with 5 international vendors, securing a 10\% discount on bulk software subscriptions.
\end{itemize}

\vspace{2mm}
\noindent \textbf{FinTech Solutions} \hfill Dallas, TX\\
\textit{Business Analyst} \hfill July 2019 - May 2021
\begin{itemize}[leftmargin=*,noitemsep]
    \item Leveraged SQL to extract and analyze financial datasets comprising over 5 million records.
    \item Authored technical documentation that decreased onboarding time for new analysts from 14 days to 5 days.
\end{itemize}

\vspace{4mm}
\noindent \textbf{\large SKILLS}
\vspace{-2mm}
\rule{\textwidth}{0.5pt}
\vspace{2mm}

\noindent \textbf{Business:} Agile, Scrum, Product Strategy, Market Analysis\\
\textbf{Technical:} SQL, Python, Excel, HTML, CSS\\
\textbf{Languages:} English (Native), Mandarin (Fluent)
\end{document}
```
