This is the entry point to the application
https://task-url-shortner-jfkd6hfmh-vivek-sharmas-projects-bb4e4fe9.vercel.app/

login using your google account. User will be presented with a simple UI to enter shorturl….

UI is created using simple EJS templating in node j. initially I thought of creating a react UI but decided not to overload the project
**UI needed to be created because google auth is tricky with using postman

On entering long url, a corresponding short url will be created using the redirectURL api
https://okgpny85rg.execute-api.ap-south-1.amazonaws.com/dev/shorten  
the shorturl will be of the format

Your Shortened URL:
shortURL/6a8e3009

after clicking on it a get request will be sent to th following route
GET /api/:alias
•	Description: Redirects to the original long URL associated with the given alias.
•	Parameters:
o	alias: The custom alias or generated alias of the shortened URL.
•	Middleware: isAuth (Authentication Middleware)
•	Response:
o	Redirects to the original long URL.


ANALYTICS ROUTE
GET /api/analytics/:alias
•	Description: Provides analytics for the shortened URL with the given alias.
•	Parameters:
o	alias: The alias of the shortened URL.
•	Response: JSON response containing total clicks, unique clicks, and click data by date, OS, and device type.

Topic based analytics 

GET /api/analytics/topic/:topic
•	Description: Provides analytics for all shortened URLs under a specific topic.
•	Parameters:
o	topic: The topic/category to group the URLs under.
•	Response: JSON response containing total clicks, unique clicks, clicks by date, and details of URLs under the specified topic.

Other project details….


Unit tests written using  JEST library to test basic functionality
REDIS…redis caching implemented using UPSTASH.caching is implemented in redirectURL.
First redirect query is retrieved from db after that it gets from redis db
RATE LIMITING-  only three clicks per minute are allowed on a single url alias to prevent overload

