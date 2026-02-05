/**
 * Sample LinkedIn data for demo purposes
 * Based on real LinkedIn export format
 */

export const SAMPLE_CONNECTIONS_CSV = `Notes:
"When exporting your connection data, you may notice that some of the email addresses are missing."

First Name,Last Name,URL,Email Address,Company,Position,Connected On
Sarah,Chen,https://www.linkedin.com/in/sarahchen,sarah@stripe.com,Stripe,Head of Engineering,15 Jan 2024
Michael,Rodriguez,https://www.linkedin.com/in/mrodriguez,michael.r@google.com,Google,Senior Product Manager,20 Mar 2023
Emma,Thompson,https://www.linkedin.com/in/emmathompson,,Meta,Director of Design,10 May 2023
James,Wilson,https://www.linkedin.com/in/jameswilson,jwilson@amazon.com,Amazon,Principal Engineer,05 Jun 2022
Lisa,Park,https://www.linkedin.com/in/lisapark,lisa.park@netflix.com,Netflix,VP of Product,18 Jul 2024
David,Kim,https://www.linkedin.com/in/davidkim,,Microsoft,Engineering Manager,22 Aug 2023
Anna,Mueller,https://www.linkedin.com/in/annamueller,anna@spotify.com,Spotify,Senior Data Scientist,01 Sep 2023
Robert,Taylor,https://www.linkedin.com/in/roberttaylor,r.taylor@airbnb.com,Airbnb,CTO,15 Oct 2022
Jennifer,Lee,https://www.linkedin.com/in/jenniferlee,,Uber,Head of Growth,25 Nov 2023
Christopher,Brown,https://www.linkedin.com/in/chrisbrown,chris@openai.com,OpenAI,Research Scientist,10 Dec 2024
Maria,Garcia,https://www.linkedin.com/in/mariagarcia,,Salesforce,Account Executive,05 Jan 2024
Thomas,Anderson,https://www.linkedin.com/in/tanderson,thomas.a@figma.com,Figma,Staff Designer,15 Feb 2023
Sophie,Williams,https://www.linkedin.com/in/sophiewilliams,sophie@notion.so,Notion,Product Lead,20 Mar 2024
Daniel,Martinez,https://www.linkedin.com/in/dmartinez,,LinkedIn,Senior Recruiter,25 Apr 2023
Rachel,Johnson,https://www.linkedin.com/in/racheljohnson,rachel.j@slack.com,Slack,Engineering Director,30 May 2022`;

export const SAMPLE_MESSAGES_CSV = `CONVERSATION ID,CONVERSATION TITLE,FROM,SENDER PROFILE URL,TO,RECIPIENT PROFILE URLS,DATE,SUBJECT,CONTENT,FOLDER,ATTACHMENTS
conv-001,,Sarah Chen,https://www.linkedin.com/in/sarahchen,Demo User,https://www.linkedin.com/in/demouser,2025-01-15 14:30:00 UTC,,"Hey! Great meeting you at the conference last week. Let's definitely catch up soon - I'd love to hear more about what you're building.",INBOX,
conv-001,,Demo User,https://www.linkedin.com/in/demouser,Sarah Chen,https://www.linkedin.com/in/sarahchen,2025-01-16 09:15:00 UTC,,"Thanks Sarah! Was great chatting with you too. Would love to learn more about Stripe's approach to engineering leadership. Coffee next week?",INBOX,
conv-001,,Sarah Chen,https://www.linkedin.com/in/sarahchen,Demo User,https://www.linkedin.com/in/demouser,2025-01-16 11:45:00 UTC,,"Absolutely! How about Thursday at 2pm? There's a great cafe near our office in SoMa.",INBOX,
conv-002,,Michael Rodriguez,https://www.linkedin.com/in/mrodriguez,Demo User,https://www.linkedin.com/in/demouser,2024-08-10 16:20:00 UTC,,"Hey there! Saw your post about AI in recruitment - really interesting perspective. We should connect sometime.",INBOX,
conv-002,,Demo User,https://www.linkedin.com/in/demouser,Michael Rodriguez,https://www.linkedin.com/in/mrodriguez,2024-08-12 10:00:00 UTC,,"Thanks Michael! I'd love to hear how Google is thinking about this space.",INBOX,
conv-003,,Robert Taylor,https://www.linkedin.com/in/roberttaylor,Demo User,https://www.linkedin.com/in/demouser,2024-03-05 09:00:00 UTC,,"Quick question - do you have any recommendations for technical recruiters who specialize in senior engineering roles?",INBOX,
conv-003,,Demo User,https://www.linkedin.com/in/demouser,Robert Taylor,https://www.linkedin.com/in/roberttaylor,2024-03-06 14:30:00 UTC,,"Yes! Let me introduce you to a few people who've been great to work with.",INBOX,
conv-004,,Christopher Brown,https://www.linkedin.com/in/chrisbrown,Demo User,https://www.linkedin.com/in/demouser,2025-01-20 11:00:00 UTC,,"Really impressed by your work on RecruitOS. Would love to chat about potential collaboration opportunities. Are you free this week?",INBOX,
conv-005,,Emma Thompson,https://www.linkedin.com/in/emmathompson,Demo User,https://www.linkedin.com/in/demouser,2024-06-15 15:45:00 UTC,,"Thanks for the intro to the design community! Really helpful connections.",INBOX,
conv-006,,Lisa Park,https://www.linkedin.com/in/lisapark,Demo User,https://www.linkedin.com/in/demouser,2025-01-25 10:30:00 UTC,,"Hey! Netflix is hiring for a unique role that might interest you. Can we set up a call?",INBOX,
conv-007,,Daniel Martinez,https://www.linkedin.com/in/dmartinez,Demo User,https://www.linkedin.com/in/demouser,2024-09-01 09:00:00 UTC,,"I'd love to learn more about how you're approaching AI in recruitment. Let's catch up when you have time!",INBOX,`;

export const SAMPLE_ENDORSEMENTS_RECEIVED_CSV = `Endorsement Date,Skill Name,Endorser First Name,Endorser Last Name,Endorser Public Url,Endorsement Status
2025/01/10 14:25:00 UTC,Product Management,Sarah,Chen,www.linkedin.com/in/sarahchen,ACCEPTED
2025/01/10 14:24:00 UTC,Technical Leadership,Sarah,Chen,www.linkedin.com/in/sarahchen,ACCEPTED
2024/12/15 09:30:00 UTC,Machine Learning,Christopher,Brown,www.linkedin.com/in/chrisbrown,ACCEPTED
2024/12/15 09:29:00 UTC,AI Strategy,Christopher,Brown,www.linkedin.com/in/chrisbrown,ACCEPTED
2024/11/20 16:45:00 UTC,Growth Marketing,Lisa,Park,www.linkedin.com/in/lisapark,ACCEPTED
2024/10/05 11:00:00 UTC,SaaS,Robert,Taylor,www.linkedin.com/in/roberttaylor,ACCEPTED
2024/10/05 10:59:00 UTC,Startups,Robert,Taylor,www.linkedin.com/in/roberttaylor,ACCEPTED
2024/09/15 14:20:00 UTC,Recruiting,Daniel,Martinez,www.linkedin.com/in/dmartinez,ACCEPTED
2024/08/01 09:15:00 UTC,Data Analysis,Michael,Rodriguez,www.linkedin.com/in/mrodriguez,ACCEPTED`;

export const SAMPLE_ENDORSEMENTS_GIVEN_CSV = `Endorsement Date,Skill Name,Endorsee First Name,Endorsee Last Name,Endorsee Public Url,Endorsement Status
2024/12/20 11:30:00 UTC,Engineering Leadership,Sarah,Chen,www.linkedin.com/in/sarahchen,ACCEPTED
2024/11/15 10:00:00 UTC,Product Strategy,Michael,Rodriguez,www.linkedin.com/in/mrodriguez,ACCEPTED
2024/10/10 15:45:00 UTC,UX Design,Emma,Thompson,www.linkedin.com/in/emmathompson,ACCEPTED`;

export const SAMPLE_RECOMMENDATIONS_RECEIVED_CSV = `First Name,Last Name,Company,Job Title,Text,Creation Date,Status
Robert,Taylor,Airbnb,CTO,"I've had the pleasure of working with this person on multiple projects. Their understanding of both technical and business requirements is exceptional. They have a unique ability to bridge the gap between engineering teams and stakeholders, making them an invaluable asset to any organization. Highly recommend!","10/15/24, 09:30 AM",VISIBLE
Sarah,Chen,Stripe,Head of Engineering,"An outstanding professional with deep expertise in product development and go-to-market strategy. Their data-driven approach and attention to detail consistently delivers results. A true pleasure to collaborate with.","01/20/25, 02:15 PM",VISIBLE`;

export const SAMPLE_RECOMMENDATIONS_GIVEN_CSV = `First Name,Last Name,Company,Job Title,Text,Creation Date,Status
Michael,Rodriguez,Google,Senior Product Manager,"Michael is one of the most thoughtful product managers I've worked with. His ability to synthesize complex user needs into clear product requirements is remarkable. He brings both strategic thinking and hands-on execution to every project.","09/05/24, 11:00 AM",VISIBLE`;
