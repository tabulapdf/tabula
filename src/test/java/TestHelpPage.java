import org.junit.After;
import org.junit.Test;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.firefox.FirefoxDriver;

//
public class TestHelpPage {
    WebDriver driver;
    @Test
    public void startWebDriver() throws InterruptedException{
        driver = new FirefoxDriver();
        //driver.manage().timeouts().implicitlyWait(40, TimeUnit.SECONDS);
        driver.get("http://127.0.0.1:9292/");

        try{
         /*   //testing
            driver.findElement(By.id("help-nav")).click();
            driver.findElement(By.linkText("How To Use Tabula")).click();
            assertTrue("Failed, couldn't find Help page from href link", "How to Use Tabula"
                    .equals(driver.findElement(By.id("tabulahelp")).getText()));
            driver.findElement(By.linkText("Regex Help")).click();
            assertTrue("Failed, couldn't find Help page from href link", "Regex Help"
                    .equals(driver.findElement(By.id("regexhelp")).getText()));
            driver.findElement(By.linkText("Troubleshooting")).click();
            assertTrue("Failed, couldn't find Help page from href link", "Having trouble with Tabula?"
                    .equals(driver.findElement(By.id("troubleshooting")).getText()));
         //   WebDriverWait wait = new WebDriverWait(driver, 20);
            driver.quit();*/

        }catch(Exception e){
            System.out.print(e);

        }

    }
    //whether the test case passes or not, the instance of the browser will close
    @After
    public void TearDown(){
        driver.quit();
    }
}
