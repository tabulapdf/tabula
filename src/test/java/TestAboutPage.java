import org.junit.After;
import org.junit.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.firefox.FirefoxDriver;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.util.concurrent.TimeUnit;

import static junit.framework.TestCase.assertTrue;

//Checks the multiple links found on the About page.
// TODO: check for the 3 links that open up a new tab instead of navigating through the same back. The rest of the links are passing the test cases
//@author: SM  modified: 2/18/18
public class TestAboutPage {
  WebDriver driver;
    @Test
    public void startWebDriver() throws InterruptedException{
        driver = new FirefoxDriver();
        driver.get("http://127.0.0.1:9292/");
        WebDriverWait wait = new WebDriverWait(driver, 100);

        try {
            //checks for the multiple links found on the About page and compares the url that the link navigates
            // to the one that is set for in the html page
            By about_id = By.linkText("About");
            WebElement about_icon = wait.until(ExpectedConditions.visibilityOfElementLocated(about_id));
            about_icon.click();
            WebElement about_icon2 = wait.until(ExpectedConditions.visibilityOfElementLocated(about_id));
            about_icon2.click();
            String about_title = "About Tabula";
            By abouttabula_classname = By.className("abouttabula");
            WebElement abouttabula = wait.until(ExpectedConditions.visibilityOfElementLocated(abouttabula_classname));
            assertTrue("Failed, couldn't find About page", about_title.equals(abouttabula.getText()));

            By github_fork_link = By.id("github_fork");
            WebElement github_fork = wait.until(ExpectedConditions.elementToBeClickable(github_fork_link));
            github_fork.click();
            String tabula_github_url = "https://github.com/tabulapdf/tabula";
            assertTrue("Failed, couldn't find Tabula's GitHub page", driver.getCurrentUrl().equals(tabula_github_url));
            driver.navigate().back();

           /* By Manuel_text = By.linkText("Manuel Aristarán");
            WebElement Manuel_link = wait.until(ExpectedConditions.elementToBeClickable(Manuel_text));
            Manuel_link.click();
            Thread.sleep(2000);
            String Manuel_url = "http://jazzido.com/";
            assertTrue("Failed, couldn't find Manuel Aristarán's page", driver.getCurrentUrl().equals(Manuel_url));
            driver.navigate().back();

            By Mike_text = By.linkText("Mike Tigas");
            WebElement Mike_link = wait.until(ExpectedConditions.elementToBeClickable(Mike_text));
            Mike_link.click();
            String Mike_url = "https://mike.tig.as/";
            assertTrue("Failed, couldn't find Mike Tigas's page", driver.getCurrentUrl().equals(Mike_url));
            driver.navigate().back();

            By Jeremy_text = By.linkText("Jeremy B. Merrill");
            WebElement Jeremy_link = wait.until(ExpectedConditions.elementToBeClickable(Jeremy_text));
            Jeremy_link.click();
            String Jeremy_url = "http://jeremybmerrill.com/";
            assertTrue("Failed, couldn't find Jeremy B. Merrill's page", driver.getCurrentUrl().equals(Jeremy_url));
            driver.navigate().back();*/

            By ProPublica_text = By.linkText("ProPublica");
            WebElement ProPublica_link = wait.until(ExpectedConditions.elementToBeClickable(ProPublica_text));
            ProPublica_link.click();
            String ProPublica_url = "https://www.propublica.org/";
            driver.manage().timeouts().pageLoadTimeout(60, TimeUnit.SECONDS);
            assertTrue("Failed, couldn't find ProPublica's page", driver.getCurrentUrl().equals(ProPublica_url));
            driver.navigate().back();

            By LaNacion_text = By.linkText("La Nación DATA");
            WebElement LaNacion_link = wait.until(ExpectedConditions.elementToBeClickable(LaNacion_text));
            LaNacion_link.click();
            String LaNacion_url = "http://blogs.lanacion.com.ar/data/";
            driver.manage().timeouts().pageLoadTimeout(60, TimeUnit.SECONDS);
            assertTrue("Failed, couldn't find La Nacion DATA's page", driver.getCurrentUrl().equals(LaNacion_url));
            driver.navigate().back();

            By KnightMozilla_text = By.linkText("Knight-Mozilla OpenNews");
            WebElement KnightMozilla_link = wait.until(ExpectedConditions.elementToBeClickable(KnightMozilla_text));
            KnightMozilla_link.click();
            String KnightMozilla_url = "https://opennews.org/";
            driver.manage().timeouts().pageLoadTimeout(60, TimeUnit.SECONDS);
            assertTrue("Failed, couldn't find Knight-Mozilla OpenNews' page", driver.getCurrentUrl().equals(KnightMozilla_url));
            driver.navigate().back();

            By NYTimes_text = By.linkText("The New York Times");
            WebElement NYTimes_link = wait.until(ExpectedConditions.elementToBeClickable(NYTimes_text));
            NYTimes_link.click();
            String NYTimes_url = "https://www.nytimes.com/";
            driver.manage().timeouts().pageLoadTimeout(60, TimeUnit.SECONDS);
            assertTrue("Failed, couldn't find The New York Times' page", driver.getCurrentUrl().equals(NYTimes_url));
            driver.navigate().back();

            By NUKnight_text = By.linkText("Northwestern University Knight Lab");
            WebElement NUKnight_link = wait.until(ExpectedConditions.elementToBeClickable(NUKnight_text));
            NUKnight_link.click();
            String NUKnight_url = "https://knightlab.northwestern.edu/";
            driver.manage().timeouts().pageLoadTimeout(60, TimeUnit.SECONDS);
            assertTrue("Failed, couldn't find Northwestern University Knight Lab's page", driver.getCurrentUrl().equals(NUKnight_url));
            driver.navigate().back();

            By KnightFoundation_text = By.linkText("The Knight Foundation");
            WebElement KnightFoundation_link = wait.until(ExpectedConditions.elementToBeClickable(KnightFoundation_text));
            KnightFoundation_link.click();
            String KnightFoundation_url = "https://www.knightfoundation.org/";
            driver.manage().timeouts().pageLoadTimeout(60, TimeUnit.SECONDS);
            assertTrue("Failed, couldn't find The Knight Foundation's page", driver.getCurrentUrl().equals(KnightFoundation_url));
            driver.navigate().back();

            By Shuttleworth_text = By.linkText("The Shuttleworth Foundation");
            WebElement Shuttleworth_link = wait.until(ExpectedConditions.elementToBeClickable(Shuttleworth_text));
            Shuttleworth_link.click();
            String Shuttleworth_url = "https://shuttleworthfoundation.org/";
            driver.manage().timeouts().pageLoadTimeout(60, TimeUnit.SECONDS);
            assertTrue("Failed, couldn't find The Shuttleworth Foundation's page", driver.getCurrentUrl().equals(Shuttleworth_url));
            driver.navigate().back();

            By Jason_text = By.linkText("Jason Das.");
            WebElement Jason_link = wait.until(ExpectedConditions.elementToBeClickable(Jason_text));
            Jason_link.click();
            String Jason_url = "http://www.jasondas.com/";
            driver.manage().timeouts().pageLoadTimeout(60, TimeUnit.SECONDS);
            assertTrue("Failed, couldn't find Jason Das's page", driver.getCurrentUrl().equals(Jason_url));

            driver.navigate().back();

        }catch(Exception e){
            System.out.print(e);

        }
    }
    @After
    public void TearDown(){
        driver.quit();
    }
}